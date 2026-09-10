from __future__ import annotations
from dataclasses import dataclass
from pcbai.steps.footprint_qfn_qfp import KiCadModuleWriter

@dataclass
class CustomParams:
    name: str
    coordinates: str # JSON string of coordinates

import json

def generate_custom(params: CustomParams) -> str:
    """Generate a custom footprint based on a JSON array of coordinates.
    Expected format: [{"id": "1", "x": 0.0, "y": 0.0, "shape": "rect", "w": 1.0, "h": 1.0, "type": "smd"}]
    """
    mod = f"""(module "{params.name}" (layer "F.Cu") (tedit 60000000)
  (descr "Custom Footprint")
  (fp_text reference "REF**" (at 0 -2.5) (layer "F.SilkS"))
  (fp_text value "{params.name}" (at 0 2.5) (layer "F.Fab"))
"""
    try:
        coords = json.loads(params.coordinates)
        for pad in coords:
            pid = pad.get("id", "")
            px = pad.get("x", 0.0)
            py = pad.get("y", 0.0)
            shape = pad.get("shape", "rect")
            pw = pad.get("w", 1.0)
            ph = pad.get("h", 1.0)
            ptype = pad.get("type", "smd")
            
            if ptype == "smd":
                mod += f'  (pad "{pid}" smd {shape} (at {px} {py}) (size {pw} {ph}) (layers "F.Cu" "F.Paste" "F.Mask"))\n'
            else:
                drill = pad.get("drill", min(pw, ph) * 0.6)
                mod += f'  (pad "{pid}" thru_hole {shape} (at {px} {py}) (size {pw} {ph}) (drill {drill}) (layers *.Cu *.Mask))\n'
    except Exception as e:
        mod += f"  ;; Error parsing coordinates: {e}\n"
        
    mod += ")\n"
    return mod
