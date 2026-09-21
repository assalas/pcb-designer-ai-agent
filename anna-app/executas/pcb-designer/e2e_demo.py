#!/usr/bin/env python3
import os
import json
import sys
from test_harness import AnnaLocalHarness

def main():
    print("🤖 Starting End-to-End PCB Designer Agent Simulation...\n")
    
    # Initialize our local harness (mock_sampling=True uses the local mocked LLM logic)
    harness = AnnaLocalHarness(mock_sampling=True)
    
    build_dir = os.path.abspath("build")
    fp_dir = os.path.join(build_dir, "footprints")
    os.makedirs(fp_dir, exist_ok=True)
    
    pdf_path = os.path.abspath("test_datasheet_LM5164.pdf")
    
    if not os.path.exists(pdf_path):
        print(f"❌ Error: Datasheet not found at {pdf_path}")
        sys.exit(1)

    print("Step 1. Extracting parameters from Datasheet PDF (extract_package_from_pdf)")
    resp = harness.invoke_tool("extract_package_from_pdf", {"pdf_path": pdf_path})
    pkg_params = resp["result"]["data"]
    print(f"  ➜ Extracted: {pkg_params['pins']}-pin {pkg_params['pkg_type'].upper()}, pitch {pkg_params['pitch']}mm")

    print("\nStep 2. Generating KiCad Footprint (generate_footprint)")
    pkg_params["name"] = "LM5164_SOIC"
    resp = harness.invoke_tool("generate_footprint", {
        "footprint_type": pkg_params["pkg_type"],
        "params_json": json.dumps(pkg_params)
    })
    fp_content = resp["result"]["data"]["kicad_mod_content"]
    fp_path = os.path.join(fp_dir, "LM5164_SOIC.kicad_mod")
    with open(fp_path, "w") as f:
        f.write(fp_content)
    print(f"  ➜ Saved to: {os.path.relpath(fp_path)}")

    print("\nStep 3. Generating Bill of Materials (generate_bom)")
    # Simulating what the agent would extract from a user's prompt
    reqs = {"keywords": ["mcu", "LM5164", "usb"], "voltage": "12V"}
    resp = harness.invoke_tool("generate_bom", {"requirements_json": json.dumps(reqs)})
    bom = resp["result"]["data"]["bom"]
    print(f"  ➜ BOM has {len(bom)} components.")

    print("\nStep 4. Synthesizing Logic Netlist (synthesize_netlist)")
    resp = harness.invoke_tool("synthesize_netlist", {"bom_json": json.dumps(bom)})
    netlist = resp["result"]["data"]["netlist"]
    print(f"  ➜ Created logical netlist structure.")

    print("\nStep 5. Running Auto-Router and Smart Placer (route_pcb)")
    resp = harness.invoke_tool("route_pcb", {
        "netlist_json": json.dumps(netlist),
        "output_dir": build_dir
    }, timeout=30)
    
    result = resp["result"]["data"]
    print(f"  ➜ Router Status: {result.get('status')}")
    
    print("\n✅ End-to-End Complete!")
    if result.get('board_file') and os.path.exists(result.get('board_file')):
        print(f"🎉 Your KiCad board file is ready: {os.path.relpath(result.get('board_file'))}")
    else:
        print(f"⚠️ Board script ran, but output wasn't created. Ensure KiCad 'pcbnew' python bindings are available.")
    
    harness.close()

if __name__ == "__main__":
    main()
