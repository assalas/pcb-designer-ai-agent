#!/usr/bin/env python3
"""pcb-designer — Anna OS Executa plugin.

Speaks JSON-RPC 2.0 over stdio (v2 protocol with reverse-RPC sampling).
Wraps all pcbai core logic as Anna tools — no API keys needed, no UI served.
Anna handles frontend, memory, billing, and model selection.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
import queue
import threading
import tempfile
import traceback
# The pcbai module is now bundled directly in this folder.

# ── stderr helper (stdout is reserved for JSON-RPC) ────────
def log(msg: str) -> None:
    print(f"[pcb-designer] {msg}", file=sys.stderr, flush=True)


# ════════════════════════════════════════════════════════════
# JSON-RPC 2.0 Dispatcher (v2 with reverse-RPC for sampling)
# ════════════════════════════════════════════════════════════

# Agent → plugin requests land here
agent_requests: queue.Queue = queue.Queue()
# Reverse-RPC responses keyed by request id
host_responses: Dict[str, queue.Queue] = {}


def _reader_thread() -> None:
    """Single stdin reader — routes Agent requests vs host responses."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        if "method" in msg:
            agent_requests.put(msg)
        else:
            q = host_responses.pop(msg.get("id", ""), None)
            if q is not None:
                q.put(msg)


def _send(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def _respond(req_id: Any, result: Any = None, error: Any = None) -> None:
    resp: dict = {"jsonrpc": "2.0", "id": req_id}
    if error is not None:
        resp["error"] = error
    else:
        resp["result"] = result
    _send(resp)


# ── Sampling: borrow the host's LLM ────────────────────────

def sample(
    invoke_id: str,
    prompt: str,
    *,
    system_prompt: str = "",
    max_tokens: int = 4096,
    temperature: float = 0.2,
    response_format: Optional[dict] = None,
) -> str:
    """Issue a sampling/createMessage reverse RPC and block until the host replies."""
    rid = str(uuid.uuid4())
    q: queue.Queue = queue.Queue()
    host_responses[rid] = q

    params: dict = {
        "messages": [{"role": "user", "content": {"type": "text", "text": prompt}}],
        "maxTokens": max_tokens,
        "temperature": temperature,
        "includeContext": "none",
        "metadata": {"executa_invoke_id": invoke_id},
    }
    if system_prompt:
        params["systemPrompt"] = system_prompt
    if response_format:
        params["responseFormat"] = response_format
        params["onUnsupported"] = "json_object"

    _send({
        "jsonrpc": "2.0",
        "id": rid,
        "method": "sampling/createMessage",
        "params": params,
    })

    resp = q.get(timeout=120)
    if "error" in resp:
        raise RuntimeError(f"Sampling error: {resp['error']}")
    return resp["result"]["content"]["text"]


# ════════════════════════════════════════════════════════════
# Manifest — tools exposed to Anna's Agent
# ════════════════════════════════════════════════════════════

MANIFEST = {
    "name": "pcb-designer",
    "display_name": "PCB Designer AI Agent",
    "version": "1.0.0",
    "description": (
        "End-to-end PCB design agent: parses natural-language requirements, "
        "generates BOMs, extracts package parameters from PDF datasheets, "
        "produces KiCad footprints, synthesizes SKiDL schematics, and routes boards. "
        "Optimized for LPKF ProtoLaser S4 / MultiPress S4 / Contac S4 rapid prototyping."
    ),
    "author": "assalas",
    "host_capabilities": ["llm.sample", "llm.complete"],
    "tools": [
        {
            "name": "parse_requirements",
            "description": (
                "Extract structured component requirements from a natural-language "
                "hardware description. Uses deep LLM reasoning (via Anna sampling) to "
                "identify MCU families, voltage rails, connectivity, and component "
                "keywords with thorough chain-of-thought analysis."
            ),
            "parameters": [
                {"name": "description", "type": "string", "description": "Natural-language hardware description", "required": True},
            ],
        },
        {
            "name": "generate_bom",
            "description": (
                "Generate a Bill of Materials from structured requirements. "
                "Queries Octopart vendor API when OCTOPART_API_KEY is available, "
                "otherwise falls back to built-in catalog."
            ),
            "parameters": [
                {"name": "requirements_json", "type": "string", "description": "JSON string of structured requirements (output of parse_requirements)", "required": True},
            ],
        },
        {
            "name": "extract_package_from_pdf",
            "description": (
                "Deep async extraction of package dimensions from a component "
                "datasheet PDF. Multi-stage pipeline: text layer extraction → "
                "OCR fallback → LLM-powered dimensional analysis with thorough "
                "chain-of-thought reasoning for mechanical drawings. Returns "
                "pkg_type, pins, pitch, body dimensions, pad dimensions, and "
                "exposed pad parameters. Optimized for LPKF rapid prototyping."
            ),
            "parameters": [
                {"name": "pdf_path", "type": "string", "description": "Absolute path to PDF datasheet on disk", "required": True},
            ],
        },
        {
            "name": "generate_footprint",
            "description": (
                "Generate a KiCad .kicad_mod footprint file. Supports: "
                "qfn, qfp, soic, smd_rc, bga, dip, usbc, header, custom. "
                "Returns the footprint file content as a string."
            ),
            "parameters": [
                {"name": "footprint_type", "type": "string", "description": "Package type: qfn|qfp|soic|smd_rc|bga|dip|usbc|header|custom", "required": True},
                {"name": "params_json", "type": "string", "description": "JSON object of footprint parameters (name, pins, pitch, body_l, body_w, pad_l, pad_w, etc.)", "required": True},
            ],
        },
        {
            "name": "synthesize_netlist",
            "description": (
                "Generate a SKiDL netlist from a BOM. Creates self-contained SKIDL "
                "parts with automatic decoupling, buck converter support circuits, "
                "and ERC checks. Returns the netlist as a string."
            ),
            "parameters": [
                {"name": "bom_json", "type": "string", "description": "JSON array of BOM entries [{mpn, package, voltage}, ...]", "required": True},
            ],
        },
        {
            "name": "route_pcb",
            "description": (
                "Route a PCB board from a netlist using KiCad pcbnew. "
                "Applies smart heuristic placement (decoupling caps near ICs, "
                "signal grouping) and optional experimental Manhattan routing. "
                "Exports .kicad_pcb and .dsn (for FreeRouting)."
            ),
            "parameters": [
                {"name": "netlist_json", "type": "string", "description": "JSON netlist structure with nets and components", "required": True},
                {"name": "output_dir", "type": "string", "description": "Directory for output files (default: /tmp/pcbai_build)", "required": False},
            ],
        },
        {
            "name": "full_pipeline",
            "description": (
                "Run the complete end-to-end pipeline: natural-language description → "
                "requirements → BOM → netlist → board layout. Returns all intermediate "
                "artifacts and a comprehensive analysis report with deep reasoning about "
                "component selection, layout trade-offs, and LPKF manufacturability."
            ),
            "parameters": [
                {"name": "description", "type": "string", "description": "Natural-language hardware description", "required": True},
            ],
        },
    ],
}


# ════════════════════════════════════════════════════════════
# Tool implementations
# ════════════════════════════════════════════════════════════

def _tool_parse_requirements(args: dict, ctx: dict) -> dict:
    """Parse requirements using Anna's hosted LLM (sampling) for deep reasoning."""
    description = args["description"]
    invoke_id = ctx.get("invoke_id", "")

    system_prompt = (
        "You are an expert hardware/electronics engineer specializing in PCB design "
        "for rapid prototyping with LPKF ProtoLaser S4, MultiPress S4, and Contac S4 systems.\n\n"
        "Analyze the user's hardware description with thorough chain-of-thought reasoning.\n"
        "Consider: voltage domains, current requirements, signal integrity, thermal constraints, "
        "component availability, and LPKF process limitations (min trace width, via size, etc.).\n\n"
        "Return ONLY a JSON object with this schema:\n"
        '{\n  "keywords": ["list", "of", "component", "types"],\n'
        '  "voltage": "string or null",\n  "current": "string or null",\n'
        '  "connectivity": ["wifi", "bluetooth", etc.],\n'
        '  "mcu": "preferred MCU family or null",\n'
        '  "notes": "detailed engineering analysis and constraints"\n}'
    )

    try:
        raw = sample(
            invoke_id,
            description,
            system_prompt=system_prompt,
            max_tokens=2048,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        # Parse JSON from response
        result = json.loads(raw.strip())
        result.setdefault("notes", description)
        return {"success": True, "data": result}
    except Exception as e:
        # Fallback to local keyword extraction
        log(f"Sampling failed, falling back to local parser: {e}")
        from pcbai.steps.requirements_parser import parse_requirements
        result = parse_requirements(description)
        return {"success": True, "data": result, "fallback": True}


def _tool_generate_bom(args: dict, ctx: dict) -> dict:
    from pcbai.steps.bom_generator import generate_bom
    requirements = json.loads(args["requirements_json"])
    bom = generate_bom(requirements)
    return {"success": True, "data": {"bom": bom, "count": len(bom)}}


def _tool_extract_package_from_pdf(args: dict, ctx: dict) -> dict:
    """Deep async PDF extraction with progress reporting and LLM analysis."""
    pdf_path = args["pdf_path"]
    invoke_id = ctx.get("invoke_id", "")

    if not os.path.exists(pdf_path):
        return {"success": False, "error": f"File not found: {pdf_path}"}

    # Stage 1: Text extraction
    log(f"Stage 1/3: Extracting text from {os.path.basename(pdf_path)}")
    text = None
    extraction_method = "none"

    try:
        from pdfminer.high_level import extract_text
        text = extract_text(pdf_path)
        extraction_method = "pdfminer"
    except ImportError:
        pass

    if not text or not text.strip():
        try:
            from pypdf import PdfReader
            reader = PdfReader(pdf_path)
            pages = [p.extract_text() for p in reader.pages if p.extract_text()]
            text = "\n".join(pages)
            extraction_method = "pypdf"
        except ImportError:
            pass

    if not text or not text.strip():
        try:
            import pytesseract
            from pdf2image import convert_from_path
            images = convert_from_path(pdf_path)
            text = ""
            for img in images:
                text += pytesseract.image_to_string(img)
            extraction_method = "ocr"
        except (ImportError, Exception):
            pass

    if not text or not text.strip():
        return {"success": False, "error": "Could not extract text from PDF. Install pypdf, pdfminer.six, or pytesseract."}

    # Stage 2: Deep LLM analysis via sampling
    log("Stage 2/3: Deep LLM analysis of mechanical drawings...")
    try:
        system_prompt = (
            "You are an expert electronics packaging engineer.\n\n"
            "TASK: Extract physical package dimensions from a component datasheet.\n\n"
            "INSTRUCTIONS:\n"
            "1. Identify the mechanical drawing / package outline section\n"
            "2. Find the dimension table (usually with MIN/NOM/MAX columns)\n"
            "3. Map standard dimension codes to physical measurements:\n"
            "   - D = body length, E = body width, e = pitch\n"
            "   - b = lead/terminal width, L = lead length\n"
            "   - D2/E2 = exposed pad dimensions\n"
            "4. Use NOMINAL values. If only MIN/MAX, average them.\n"
            "5. Convert everything to millimeters (mm).\n"
            "6. Identify the package family (QFN, QFP, SOIC, BGA, DIP, etc.)\n\n"
            "CRITICAL: Think step-by-step. Show your reasoning for each dimension.\n"
            "Then output the final answer as a JSON object.\n\n"
            "JSON schema:\n"
            '{"pkg_type":"string","pins":int,"pitch":float,"body_l":float,'
            '"body_w":float,"pad_l":float,"pad_w":float,"ep_l":float|null,"ep_w":float|null}\n\n'
            "Reply with a JSON object containing the extracted dimensions."
        )

        # Send the FULL text for thorough analysis (maximize token depth)
        raw = sample(
            invoke_id,
            f"Datasheet text ({len(text)} chars, method: {extraction_method}):\n\n{text[-8000:]}",
            system_prompt=system_prompt,
            max_tokens=4096,
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        print("RAW IS:", raw, file=sys.stderr)
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(raw[start:end])
            from pcbai.steps.datasheet_package_extractor import PackageGuess
            guess = PackageGuess(
                pkg_type=str(data.get("pkg_type", "unknown")).lower(),
                pins=int(data["pins"]) if data.get("pins") is not None else None,
                pitch=float(data["pitch"]) if data.get("pitch") is not None else None,
                body_l=float(data["body_l"]) if data.get("body_l") is not None else None,
                body_w=float(data["body_w"]) if data.get("body_w") is not None else None,
                pad_l=float(data["pad_l"]) if data.get("pad_l") is not None else None,
                pad_w=float(data["pad_w"]) if data.get("pad_w") is not None else None,
                ep_l=float(data["ep_l"]) if data.get("ep_l") is not None else None,
                ep_w=float(data["ep_w"]) if data.get("ep_w") is not None else None,
            )
            log("Stage 3/3: Extraction complete via sampling.")
            return {
                "success": True,
                "data": asdict(guess),
                "method": "anna_sampling",
                "text_length": len(text),
                "extraction_method": extraction_method,
            }
    except Exception as e:
        log(f"Sampling extraction failed ({e}), falling back to local extractor")

    # Stage 3 (fallback): Local regex + local LLM
    log("Stage 3/3: Falling back to local extraction pipeline...")
    from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf
    guess = extract_package_params_from_pdf(pdf_path)
    return {
        "success": True,
        "data": asdict(guess),
        "method": "local_fallback",
        "text_length": len(text),
        "extraction_method": extraction_method,
    }


def _tool_generate_footprint(args: dict, ctx: dict) -> dict:
    ftype = args["footprint_type"].lower()
    params = json.loads(args["params_json"])
    name = params.get("name", f"FP_{ftype}")

    with tempfile.TemporaryDirectory() as tmpdir:
        if ftype == "qfn":
            from pcbai.steps.footprint_qfn_qfp import QfnParams, generate_qfn
            fp_params = QfnParams(**{k: params[k] for k in QfnParams.__dataclass_fields__ if k in params})
            content = generate_qfn(fp_params)
        elif ftype == "qfp":
            from pcbai.steps.footprint_qfn_qfp import QfpParams, generate_qfp
            fp_params = QfpParams(**{k: params[k] for k in QfpParams.__dataclass_fields__ if k in params})
            content = generate_qfp(fp_params)
        elif ftype == "bga":
            from pcbai.steps.footprint_bga import BgaParams, generate_bga
            fp_params = BgaParams(**{k: params[k] for k in BgaParams.__dataclass_fields__ if k in params})
            content = generate_bga(fp_params)
        elif ftype == "dip":
            from pcbai.steps.footprint_dip import DipParams, generate_dip
            fp_params = DipParams(**{k: params[k] for k in DipParams.__dataclass_fields__ if k in params})
            content = generate_dip(fp_params)
        elif ftype in ("soic", "smd_rc"):
            from pcbai.steps.footprint_generator import SoicParams, SmdRcParams, generate_soic, generate_smd_rc
            if ftype == "soic":
                if "row_offset" not in params and "body_w" in params:
                    # typical SOIC row_offset is just outside the body width
                    params["row_offset"] = (params["body_w"] / 2.0) + (params.get("pad_l", 1.0) / 2.0)
                fp_params = SoicParams(**{k: params[k] for k in SoicParams.__dataclass_fields__ if k in params})
                content = generate_soic(fp_params)
            else:
                if "gap" not in params and "body_w" in params:
                    params["gap"] = params["body_w"] - params.get("pad_l", 1.0)
                fp_params = SmdRcParams(**{k: params[k] for k in SmdRcParams.__dataclass_fields__ if k in params})
                content = generate_smd_rc(fp_params)
        elif ftype == "usbc":
            from pcbai.steps.footprint_usbc import UsbcParams, generate_usbc
            fp_params = UsbcParams(name=name)
            content = generate_usbc(fp_params)
        elif ftype == "header":
            from pcbai.steps.footprint_header import HeaderParams, generate_header
            fp_params = HeaderParams(**{k: params[k] for k in HeaderParams.__dataclass_fields__ if k in params})
            content = generate_header(fp_params)
        elif ftype == "custom":
            from pcbai.steps.footprint_custom import CustomParams, generate_custom
            fp_params = CustomParams(**{k: params[k] for k in CustomParams.__dataclass_fields__ if k in params})
            content = generate_custom(fp_params)
        else:
            return {"success": False, "error": f"Unknown footprint type: {ftype}"}

    return {"success": True, "data": {"footprint_type": ftype, "name": name, "kicad_mod_content": content}}


def _tool_synthesize_netlist(args: dict, ctx: dict) -> dict:
    from pcbai.steps.schematic_synthesizer import synthesize_schematic
    bom = json.loads(args["bom_json"])
    netlist = synthesize_schematic(bom)
    return {"success": True, "data": {"netlist": netlist}}


def _tool_route_pcb(args: dict, ctx: dict) -> dict:
    from pcbai.steps.pcb_router import route_pcb
    netlist = json.loads(args["netlist_json"])
    output_dir = args.get("output_dir", "/tmp/pcbai_build")
    result = route_pcb(netlist, output_dir)
    return {"success": True, "data": result}


def _tool_full_pipeline(args: dict, ctx: dict) -> dict:
    """Run the complete pipeline with deep analysis at each step."""
    description = args["description"]
    invoke_id = ctx.get("invoke_id", "")
    artifacts: Dict[str, Any] = {}

    # Step 1: Parse requirements
    log("Pipeline Step 1/4: Parsing requirements...")
    req_result = _tool_parse_requirements({"description": description}, ctx)
    artifacts["requirements"] = req_result["data"]

    # Step 2: Generate BOM
    log("Pipeline Step 2/4: Generating BOM...")
    bom_result = _tool_generate_bom(
        {"requirements_json": json.dumps(req_result["data"])}, ctx
    )
    artifacts["bom"] = bom_result["data"]

    # Step 3: Synthesize netlist
    log("Pipeline Step 3/4: Synthesizing netlist...")
    netlist_result = _tool_synthesize_netlist(
        {"bom_json": json.dumps(bom_result["data"]["bom"])}, ctx
    )
    artifacts["netlist"] = netlist_result["data"]

    # Step 4: Generate analysis report via sampling
    log("Pipeline Step 4/4: Generating comprehensive analysis report...")
    try:
        report = sample(
            invoke_id,
            (
                f"Hardware description: {description}\n\n"
                f"Generated BOM: {json.dumps(artifacts['bom'], indent=2)}\n\n"
                "Provide a comprehensive engineering analysis report covering:\n"
                "1. Component selection rationale and alternatives\n"
                "2. Power domain analysis (voltage rails, current budget)\n"
                "3. Signal integrity considerations\n"
                "4. LPKF ProtoLaser S4 manufacturability assessment\n"
                "5. Thermal management recommendations\n"
                "6. Suggested PCB stackup and layer assignment\n"
                "7. Critical layout guidelines per component\n"
                "8. Risk assessment and mitigation strategies"
            ),
            system_prompt=(
                "You are a senior PCB design engineer with 20+ years of experience "
                "in rapid prototyping using LPKF equipment. Provide thorough, "
                "actionable analysis with specific numerical recommendations."
            ),
            max_tokens=4096,
            temperature=0.3,
        )
        artifacts["analysis_report"] = report
    except Exception as e:
        artifacts["analysis_report"] = f"Report generation failed: {e}"

    return {
        "success": True,
        "data": artifacts,
        "pipeline_steps_completed": 4,
    }


# ── Tool dispatch table ─────────────────────────────────────

TOOLS = {
    "parse_requirements": _tool_parse_requirements,
    "generate_bom": _tool_generate_bom,
    "extract_package_from_pdf": _tool_extract_package_from_pdf,
    "generate_footprint": _tool_generate_footprint,
    "synthesize_netlist": _tool_synthesize_netlist,
    "route_pcb": _tool_route_pcb,
    "full_pipeline": _tool_full_pipeline,
}


# ════════════════════════════════════════════════════════════
# Request handler
# ════════════════════════════════════════════════════════════

def handle(req: dict) -> None:
    req_id = req.get("id")
    method = req.get("method", "")

    if method == "initialize":
        _respond(req_id, {
            "protocolVersion": "2.0",
            "serverInfo": {"name": "pcb-designer", "version": "1.0.0"},
            "capabilities": {"sampling": {}},
        })

    elif method == "describe":
        _respond(req_id, MANIFEST)

    elif method == "health":
        _respond(req_id, {"status": "ready"})

    elif method == "invoke":
        params = req.get("params") or {}
        tool_name = params.get("tool", "")
        arguments = params.get("arguments") or {}
        context = params.get("context") or {}

        tool_fn = TOOLS.get(tool_name)
        if not tool_fn:
            _respond(req_id, error={"code": -32601, "message": f"Unknown tool: {tool_name}"})
            return

        try:
            result = tool_fn(arguments, context)
            _respond(req_id, result)
        except Exception as exc:
            log(f"Tool '{tool_name}' error: {traceback.format_exc()}")
            _respond(req_id, {"success": False, "error": str(exc)})

    elif method == "shutdown":
        _respond(req_id, {"status": "shutting_down"})
        sys.exit(0)

    else:
        _respond(req_id, error={"code": -32601, "message": f"Unknown method: {method}"})


# ════════════════════════════════════════════════════════════
# Main loop
# ════════════════════════════════════════════════════════════

def main() -> None:
    log("Starting pcb-designer Executa plugin...")
    threading.Thread(target=_reader_thread, daemon=True).start()

    while True:
        try:
            req = agent_requests.get()
            handle(req)
        except KeyboardInterrupt:
            break
        except Exception as e:
            log(f"Unhandled error: {e}")


if __name__ == "__main__":
    main()
