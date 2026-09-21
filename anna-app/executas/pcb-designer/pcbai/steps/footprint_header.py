from __future__ import annotations
from dataclasses import dataclass
from pcbai.steps.footprint_qfn_qfp import KiCadModuleWriter

@dataclass
class HeaderParams:
    name: str
    pins: int
    pitch: float
    pad_dia: float
    drill_dia: float

def generate_header(params: HeaderParams) -> str:
    # A placeholder/skeleton for a pin header footprint.
    mod = f"""(module "{params.name}" (layer "F.Cu") (tedit 60000000)
  (descr "Pin Header Placeholder")
  (fp_text reference "REF**" (at 0 -2.5) (layer "F.SilkS"))
  (fp_text value "{params.name}" (at 0 {(params.pins * params.pitch) + 2.5}) (layer "F.Fab"))
"""
    for i in range(params.pins):
        y = i * params.pitch
        shape = "rect" if i == 0 else "circle"
        mod += f'  (pad "{i+1}" thru_hole {shape} (at 0 {y}) (size {params.pad_dia} {params.pad_dia}) (drill {params.drill_dia}) (layers *.Cu *.Mask))\n'
    
    mod += ")\n"
    return mod
