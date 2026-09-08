from __future__ import annotations

from dataclasses import dataclass
from typing import List
import os

@dataclass
class BgaParams:
    name: str
    rows: int
    cols: int
    pitch: float
    body_l: float
    body_w: float
    pad_dia: float
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


def _get_bga_row_letters(num_rows: int) -> List[str]:
    """Generate JEDEC standard BGA row letters (omitting I, O, Q, S, X, Z)"""
    skip = {"I", "O", "Q", "S", "X", "Z"}
    labels = []
    for c in range(ord("A"), ord("Z") + 1):
        if chr(c) not in skip:
            labels.append(chr(c))

    if num_rows > len(labels):
        extra = []
        for l1 in labels:
            for l2 in labels:
                extra.append(l1 + l2)
        labels.extend(extra)
    return labels[:num_rows]


def generate_bga(params: BgaParams) -> str:
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

    row_letters = _get_bga_row_letters(params.rows)

    x0 = - (params.pitch * (params.cols - 1)) / 2.0
    y0 = - (params.pitch * (params.rows - 1)) / 2.0

    for r in range(params.rows):
        y = y0 + r * params.pitch
        row_char = row_letters[r]
        for c in range(params.cols):
            x = x0 + c * params.pitch
            col_num = c + 1
            pad_name = f"{row_char}{col_num}"

            lines.append(
                f"  (pad {pad_name} smd circle (at {x:.3f} {y:.3f}) (size {params.pad_dia:.3f} {params.pad_dia:.3f}) "
                f"(layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) "
                f"(solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
            )

    lines.append(")")
    return "\n".join(lines) + "\n"
