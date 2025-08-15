from __future__ import annotations

from dataclasses import dataclass
from typing import List
from pcbai.steps.footprint_generator import KiCadModuleWriter

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


def generate_qfn(params: QfnParams) -> str:
    if params.pins % 4 != 0:
        raise ValueError("QFN pins must be multiple of 4")

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
    marker_radius = 0.2
    marker_offset = marker_radius * 2
    lines.append(f"  (fp_circle (center {-hl + marker_offset:.3f} {-hw + marker_offset:.3f}) (end {-hl + marker_offset + marker_radius:.3f} {-hw + marker_offset:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads
    per_side = params.pins // 4
    # Distance from center to pad center
    row_y = hw + params.pad_l / 2.0
    row_x = hl + params.pad_l / 2.0

    # Start position for pads on each side
    x0 = - (params.pitch * (per_side - 1)) / 2.0

    # Bottom side (pins 1 to per_side)
    for i in range(per_side):
        pin_num = i + 1
        x = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {-x:.3f} {row_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Right side (pins per_side + 1 to 2 * per_side)
    for i in range(per_side):
        pin_num = per_side + i + 1
        y = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {-row_x:.3f} {-y:.3f}) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Top side (pins 2 * per_side + 1 to 3 * per_side)
    for i in range(per_side):
        pin_num = 2 * per_side + i + 1
        x = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {x:.3f} {-row_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Left side (pins 3 * per_side + 1 to 4 * per_side)
    for i in range(per_side):
        pin_num = 3 * per_side + i + 1
        y = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {row_x:.3f} {y:.3f}) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

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
    marker_radius = 0.2
    marker_offset = marker_radius * 2
    lines.append(f"  (fp_circle (center {-hl + marker_offset:.3f} {-hw + marker_offset:.3f}) (end {-hl + marker_offset + marker_radius:.3f} {-hw + marker_offset:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads
    per_side = params.pins // 4
    # Distance from center to pad center, including gullwing extension
    row_y = hw + params.pad_l / 2.0 + params.gullwing_ext
    row_x = hl + params.pad_l / 2.0 + params.gullwing_ext

    # Start position for pads on each side
    x0 = - (params.pitch * (per_side - 1)) / 2.0

    # Bottom side (pins 1 to per_side)
    for i in range(per_side):
        pin_num = i + 1
        x = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {-x:.3f} {row_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Right side (pins per_side + 1 to 2 * per_side)
    for i in range(per_side):
        pin_num = per_side + i + 1
        y = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {-row_x:.3f} {-y:.3f}) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Top side (pins 2 * per_side + 1 to 3 * per_side)
    for i in range(per_side):
        pin_num = 2 * per_side + i + 1
        x = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {x:.3f} {-row_y:.3f}) (size {params.pad_w:.3f} {params.pad_l:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    # Left side (pins 3 * per_side + 1 to 4 * per_side)
    for i in range(per_side):
        pin_num = 3 * per_side + i + 1
        y = x0 + i * params.pitch
        lines.append(
            f"  (pad {pin_num} smd rect (at {row_x:.3f} {y:.3f}) (size {params.pad_l:.3f} {params.pad_w:.3f}) (layers F.Cu F.Paste F.Mask) (solder_mask_margin {params.mask_expansion:.3f}) (solder_paste_margin_ratio {params.paste_ratio - 1.0:.3f}))"
        )

    lines.append(")")
    return "\n".join(lines) + "\n"
