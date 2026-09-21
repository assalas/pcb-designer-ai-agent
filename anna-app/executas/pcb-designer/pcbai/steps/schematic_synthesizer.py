from __future__ import annotations

from typing import List, Dict


# Placeholder for future SKiDL-based generation

def synthesize_schematic(bom: List[Dict]) -> Dict:
    """Return a toy netlist structure matching pcb_router expectations."""
    nets = [
        {"name": "GND", "pins": []},
        {"name": "VCC", "pins": []}
    ]
    for idx, part in enumerate(bom, start=1):
        part["ref"] = f"U{idx}"
        nets[0]["pins"].append(f"U{idx}")
        nets[1]["pins"].append(f"U{idx}")
    return {"nets": nets, "components": bom}
