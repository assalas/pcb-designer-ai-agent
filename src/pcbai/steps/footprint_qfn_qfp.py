from __future__ import annotations

from dataclasses import dataclass
from typing import List
import os


@dataclass
class QfnParams:
    name: str
    pins: int
    pitch: float
    body_l: float
    body_w: float
    pad_l: float
    pad_w: float
    ep_l: float | None = None
    ep_w: float | None = None
    mask_expansion: float = 0.03
    paste_ratio: float = 1.0


@dataclass
class QfpParams:
    name: str
    pins: int
    pitch: float
    body_l: float
    body_w: float
    pad_l: float
    pad_w: float
    gullwing_ext: float = 0.0
    mask_expansion: float = 0.03
    paste_ratio: float = 1.0


class KiCadModuleWriter:
    def __init__(self, libdir: str):
        self.libdir = libdir
        os.makedirs(self.libdir, exist_ok=True)

    def write(self, name: str, content: str) -> str:
        path = os.path.join(self.libdir, f"{name}.kicad_mod")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path


def _generate_quad_pads(pins: int, pitch: float, pad_l: float, pad_w: float, row_y: float, row_x: float, start_num: int, vertical: bool, mask_expansion: float, paste_ratio: float) -> List[str]:
    lines: List[str] = []
    per_side = pins // 4
    x0 = - (pitch * (per_side - 1)) / 2.0
    for i in range(per_side):
        x = x0 + i * pitch
        n = start_num + i
        if vertical:
            atx, aty = row_x, x
            size_x, size_y = pad_l, pad_w
        else:
            atx, aty = x, row_y
            size_x, size_y = pad_w, pad_l
        lines.append(
            f"  (pad {n} smd rect (at {atx:.3f} {aty:.3f}) (size {size_x:.3f} {size_y:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {mask_expansion:.3f}) (solder_paste_margin_ratio {paste_ratio - 1.0:.3f}))"
        )
    return lines


def generate_qfn(params: QfnParams) -> str:
    if params.pins % 4 != 0:
        raise ValueError("QFN pins must be multiple of 4")
    per_side = params.pins // 4
    lines: List[str] = []
    lines.append(f"(module {params.name} (layer F.Cu) (tedit 5B3079AF)")
    lines.append("  (attr smd)")
    # Body fab outline
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    fab = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw), (-hl, -hw)]
    for i in range(4):
        x1, y1 = fab[i]
        x2, y2 = fab[i+1]
        lines.append(f"  (fp_line (start {x1:.3f} {y1:.3f}) (end {x2:.3f} {y2:.3f}) (layer F.Fab) (width 0.1))")
    # Pin 1 marker
    lines.append(f"  (fp_circle (center {-hl+0.6:.3f} {-hw+0.6:.3f}) (end {-hl+0.3:.3f} {-hw+0.6:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads by side
    offset = hw + params.pad_l/2.0
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=+offset, row_x=+offset, start_num=1,  vertical=False, mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=+offset, row_x=-offset, start_num=1+per_side, vertical=True,  mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=-offset, row_x=-offset, start_num=1+2*per_side, vertical=False, mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=-offset, row_x=+offset, start_num=1+3*per_side, vertical=True,  mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)

    # Exposed pad
    if params.ep_l and params.ep_w:
        lines.append(
            f"  (pad EP smd rect (at 0 0) (size {params.ep_l:.3f} {params.ep_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    lines.append(")")
    return "\n".join(lines) + "\n"


def generate_qfp(params: QfpParams) -> str:
    if params.pins % 4 != 0:
        raise ValueError("QFP pins must be multiple of 4")
    per_side = params.pins // 4
    lines: List[str] = []
    lines.append(f"(module {params.name} (layer F.Cu) (tedit 5B3079AF)")
    lines.append("  (attr smd)")
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    fab = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw), (-hl, -hw)]
    for i in range(4):
        x1, y1 = fab[i]
        x2, y2 = fab[i+1]
        lines.append(f"  (fp_line (start {x1:.3f} {y1:.3f}) (end {x2:.3f} {y2:.3f}) (layer F.Fab) (width 0.1))")
    lines.append(f"  (fp_circle (center {-hl+0.6:.3f} {-hw+0.6:.3f}) (end {-hl+0.3:.3f} {-hw+0.6:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads (gullwing leads): extend outside body by gullwing_ext
    offset = hw + params.pad_l/2.0 + params.gullwing_ext
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=+offset, row_x=+offset, start_num=1,  vertical=False, mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=+offset, row_x=-offset, start_num=1+per_side, vertical=True,  mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=-offset, row_x=-offset, start_num=1+2*per_side, vertical=False, mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)
    lines += _generate_quad_pads(params.pins, params.pitch, params.pad_l, params.pad_w, row_y=-offset, row_x=+offset, start_num=1+3*per_side, vertical=True,  mask_expansion=params.mask_expansion, paste_ratio=params.paste_ratio)

    lines.append(")")
    return "\n".join(lines) + "\n"
