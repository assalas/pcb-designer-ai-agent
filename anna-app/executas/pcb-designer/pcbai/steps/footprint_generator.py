from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class SmdRcParams:
    name: str
    body_l: float  # mm
    body_w: float  # mm
    pad_l: float   # mm
    pad_w: float   # mm
    gap: float     # mm (solder mask clearance between pads)
    mask_expansion: float = 0.05  # mm (IPC-7351 nominal)
    paste_ratio: float = 1.0      # 1.0 = same as pad, adjust for paste reductions


@dataclass
class SoicParams:
    name: str
    pins: int
    pitch: float
    body_l: float
    body_w: float
    pad_l: float
    pad_w: float
    row_offset: float  # center of pad to body edge
    mask_expansion: float = 0.03
    paste_ratio: float = 1.0
    pin1_marker: bool = True


class KiCadModuleWriter:
    def __init__(self, libdir: str):
        self.libdir = libdir
        os.makedirs(self.libdir, exist_ok=True)

    def write(self, name: str, content: str) -> str:
        path = os.path.join(self.libdir, f"{name}.kicad_mod")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path


def generate_smd_rc(params: SmdRcParams) -> str:
    # KiCad footprint template (v6+)
    # Two pads centered on x-axis, symmetric about origin; courtyard and fab outline
    half_gap = params.gap / 2.0
    pad1_x = -(half_gap + params.pad_l / 2.0)
    pad2_x = +(half_gap + params.pad_l / 2.0)

    lines: List[str] = []
    lines.append(f"(module {params.name} (layer F.Cu) (tedit 5B3079AF)")
    lines.append("  (attr smd)")
    lines.append("  (fp_text reference REF** (at 0 -1.5) (layer F.SilkS) hide (effects (font (size 1 1) (thickness 0.15))))")
    lines.append("  (fp_text value {} (at 0 1.5) (layer F.Fab) (effects (font (size 1 1) (thickness 0.15))))".format(params.name))

    # Fab outline
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    fab = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw), (-hl, -hw)]
    for i in range(4):
        x1, y1 = fab[i]
        x2, y2 = fab[i+1]
        lines.append(f"  (fp_line (start {x1:.3f} {y1:.3f}) (end {x2:.3f} {y2:.3f}) (layer F.Fab) (width 0.1))")

    # Pads with mask/paste adjustments
    mx, my = params.mask_expansion, params.mask_expansion
    px, py = params.pad_l * params.paste_ratio, params.pad_w * params.paste_ratio
    lines.append(
        f"  (pad 1 smd rect (at {pad1_x:.3f} 0) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {mx:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
    )
    lines.append(
        f"  (pad 2 smd rect (at {pad2_x:.3f} 0) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {mx:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
    )

    lines.append(")")
    return "\n".join(lines) + "\n"


def generate_soic(params: SoicParams) -> str:
    if params.pins % 2 != 0:
        raise ValueError("SOIC pins must be even")
    pins_per_side = params.pins // 2

    lines: List[str] = []
    lines.append(f"(module {params.name} (layer F.Cu) (tedit 5B3079AF)")
    lines.append("  (attr smd)")
    lines.append("  (fp_text reference REF** (at 0 -{:.3f}) (layer F.SilkS) hide (effects (font (size 1 1) (thickness 0.15))))".format(params.body_l/2 + 2))
    lines.append("  (fp_text value {} (at 0 0) (layer F.Fab) (effects (font (size 1 1) (thickness 0.15))))".format(params.name))

    # Body fab outline
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    fab = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw), (-hl, -hw)]
    for i in range(4):
        x1, y1 = fab[i]
        x2, y2 = fab[i+1]
        lines.append(f"  (fp_line (start {x1:.3f} {y1:.3f}) (end {x2:.3f} {y2:.3f}) (layer F.Fab) (width 0.1))")

    # Pin 1 marker on Silk
    if params.pin1_marker:
        lines.append(f"  (fp_circle (center {-hl+0.6:.3f} {-hw+0.6:.3f}) (end {-hl+0.3:.3f} {-hw+0.6:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads
    # Top row (pins 1..N/2): y = +row_offset
    # Bottom row (pins N..N/2+1): y = -row_offset
    top_y = params.row_offset
    bot_y = -params.row_offset
    x0 = - (params.pitch * (pins_per_side - 1)) / 2.0
    for i in range(pins_per_side):
        x = x0 + i * params.pitch
        pad_num_top = 1 + i
        pad_num_bot = params.pins - i
        lines.append(
            f"  (pad {pad_num_top} smd rect (at {x:.3f} {top_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )
        lines.append(
            f"  (pad {pad_num_bot} smd rect (at {x:.3f} {bot_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    lines.append(")")
    return "\n".join(lines) + "\n"


def write_kicad_mod_smd_rc(outdir: str, params: SmdRcParams) -> str:
    writer = KiCadModuleWriter(outdir)
    content = generate_smd_rc(params)
    return writer.write(params.name, content)


def write_kicad_mod_soic(outdir: str, params: SoicParams) -> str:
    writer = KiCadModuleWriter(outdir)
    content = generate_soic(params)
    return writer.write(params.name, content)
