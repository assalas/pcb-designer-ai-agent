from __future__ import annotations
from dataclasses import dataclass
from pcbai.steps.footprint_qfn_qfp import KiCadModuleWriter

@dataclass
class UsbcParams:
    name: str

def generate_usbc(params: UsbcParams) -> str:
    """Generate a 24-pin USB-C Receptacle footprint."""
    mod = f"""(module "{params.name}" (layer "F.Cu") (tedit 60000000)
  (descr "USB-C Receptacle 24-pin")
  (fp_text reference "REF**" (at 0 -5) (layer "F.SilkS"))
  (fp_text value "{params.name}" (at 0 5) (layer "F.Fab"))
  (fp_line (start -4.5 -3) (end 4.5 -3) (layer "F.SilkS") (width 0.12))
  (fp_line (start 4.5 -3) (end 4.5 3) (layer "F.SilkS") (width 0.12))
  (fp_line (start 4.5 3) (end -4.5 3) (layer "F.SilkS") (width 0.12))
  (fp_line (start -4.5 3) (end -4.5 -3) (layer "F.SilkS") (width 0.12))
"""
    # 24 SMD pins. Pitch is typically 0.5mm
    pitch = 0.5
    start_x = - (12 - 0.5) * pitch / 2 # Center the 24 pins (two rows of 12 for dual-row SMT, or staggered)
    
    # Let's generate A and B rows
    for i in range(12):
        x = start_x + (i * pitch)
        mod += f'  (pad "A{i+1}" smd rect (at {x:.2f} -3.5) (size 0.3 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n'
        mod += f'  (pad "B{12-i}" smd rect (at {x:.2f} -1.5) (size 0.3 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n'
        
    # Shield pins
    mod += '  (pad "S1" thru_hole oval (at -4.32 0) (size 1.2 2.0) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n'
    mod += '  (pad "S2" thru_hole oval (at 4.32 0) (size 1.2 2.0) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n'
    mod += '  (pad "S3" thru_hole oval (at -4.32 2.5) (size 1.2 2.0) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n'
    mod += '  (pad "S4" thru_hole oval (at 4.32 2.5) (size 1.2 2.0) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n'
    
    mod += ")\n"
    return mod
