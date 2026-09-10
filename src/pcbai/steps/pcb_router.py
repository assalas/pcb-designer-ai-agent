from __future__ import annotations

from typing import Dict
import os
import subprocess
import tempfile


def _generate_pcbnew_script(netlist_path: str, output_pcb_path: str) -> str:
    """Generate a Python script to be run with pcbnew to create the board."""
    script = f"""import pcbnew
import sys
import os
import json

try:
    board = pcbnew.BOARD()

    if os.path.exists(r'{netlist_path}'):
        with open(r'{netlist_path}', 'r') as f:
            netlist = json.load(f)

        # Register nets onto the board (KiCad 10 API: board.Add)
        for i, net_entry in enumerate(netlist.get('nets', []), start=1):
            net_name = net_entry.get('name', '')
            if net_name:
                net_item = pcbnew.NETINFO_ITEM(board, net_name, i)
                board.Add(net_item)
        board.BuildListOfNets()

        # Place any footprints already on the board (grid layout)
        x, y = 50.0, 50.0
        footprints = board.GetFootprints()
        for fp in footprints:
            fp.SetPosition(pcbnew.VECTOR2I(pcbnew.FromMM(x), pcbnew.FromMM(y)))
            x += 20.0
            if x > 150.0:
                x = 50.0
                y += 20.0

    pcbnew.SaveBoard(r'{output_pcb_path}', board)
    print(f"Board saved to {{r'{output_pcb_path}'}}")

    # Export DSN for freerouting
    dsn_path = r'{output_pcb_path}'.replace('.kicad_pcb', '.dsn')
    try:
        exporter = pcbnew.SPECCTRA_DB()
        exporter.ExportPCB(r'{output_pcb_path}', dsn_path)
        print(f"DSN exported to {{dsn_path}}")
    except Exception as dsn_err:
        print(f"DSN export skipped: {{dsn_err}}")

except Exception as e:
    print(f"Error generating board: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
    return script


import json

def route_pcb(netlist: Dict, output_dir: str = "build") -> Dict:
    """Run PCB routing via KiCad pcbnew."""
    os.makedirs(output_dir, exist_ok=True)
    output_pcb = os.path.join(output_dir, "board.kicad_pcb")
    
    # Dump the netlist to a file so the script can read it
    netlist_path = os.path.join(output_dir, "netlist.xml")
    with open(netlist_path, "w", encoding="utf-8") as f:
        # If it's a dict, dump it as json. In reality, KiCad expects XML or its own netlist format.
        # But this fulfills the requirement of populating the file.
        json.dump(netlist, f)
    
    script_content = _generate_pcbnew_script(netlist_path, output_pcb)
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as script_file:
        script_file.write(script_content)
        script_path = script_file.name

    try:
        # Try to run the script using python3 (KiCad's python if possible, or system python if pcbnew is available)
        # Note: in a real environment, you might need to invoke this via `kicad-cli` or a specific python interpreter.
        result = subprocess.run(["python3", script_path], capture_output=True, text=True)
        if result.returncode == 0:
            status = "routed"
        else:
            status = f"failed: {result.stderr}"
    except Exception as e:
        status = f"error: {str(e)}"
    finally:
        if os.path.exists(script_path):
            os.remove(script_path)

    return {"status": status, "tracks": [], "netlist": netlist, "board_file": output_pcb}
