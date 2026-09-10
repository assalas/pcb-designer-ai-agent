from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional
import os


# ─────────────────────────────────────────────────────────────
# Shared writer
# ─────────────────────────────────────────────────────────────

class KiCadModuleWriter:
    def __init__(self, libdir: str):
        self.libdir = libdir
        os.makedirs(self.libdir, exist_ok=True)

    def write(self, name: str, content: str) -> str:
        path = os.path.join(self.libdir, f"{name}.kicad_mod")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path


# ─────────────────────────────────────────────────────────────
# QFN
# ─────────────────────────────────────────────────────────────

@dataclass
class QfnParams:
    name: str
    pins: int          # total pin count (must be divisible by 4)
    pitch: float       # mm between pad centres
    body_l: float      # package body length (mm)
    body_w: float      # package body width (mm)
    pad_l: float       # pad length (in direction perpendicular to body edge, mm)
    pad_w: float       # pad width (along body edge, mm)
    ep_l: Optional[float] = None   # exposed pad length (mm); None = no EP
    ep_w: Optional[float] = None   # exposed pad width (mm)


def generate_qfn(params: QfnParams) -> str:
    """Generate a KiCad 6/7/8 .kicad_mod string for a QFN package."""
    if params.pins % 4 != 0:
        raise ValueError("QFN pin count must be divisible by 4")

    per_side = params.pins // 4
    lines: List[str] = []

    lines.append(f'(module "{params.name}" (layer "F.Cu") (tedit 60000000)')
    lines.append(f'  (descr "QFN-{params.pins}, pitch {params.pitch}mm")')
    lines.append(f'  (fp_text reference "REF**" (at 0 -{params.body_l / 2 + 1.5}) (layer "F.SilkS"))')
    lines.append(f'  (fp_text value "{params.name}" (at 0 {params.body_l / 2 + 1.5}) (layer "F.Fab"))')

    # Courtyard / silkscreen body outline
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    lines.append(f'  (fp_line (start -{hw:.3f} -{hl:.3f}) (end {hw:.3f} -{hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start {hw:.3f} -{hl:.3f}) (end {hw:.3f} {hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start {hw:.3f} {hl:.3f}) (end -{hw:.3f} {hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start -{hw:.3f} {hl:.3f}) (end -{hw:.3f} -{hl:.3f}) (layer "F.SilkS") (width 0.12))')
    # Pin-1 marker
    lines.append(f'  (fp_circle (center -{hw - 0.4:.3f} -{hl - 0.4:.3f}) (end -{hw - 0.15:.3f} -{hl - 0.4:.3f}) (layer "F.SilkS") (width 0.2))')

    pad_num = 1
    # Bottom side (pins run left→right, pads extend downward)
    x0 = -((per_side - 1) * params.pitch) / 2.0
    pad_y = hl + params.pad_l / 2.0 - params.pad_l * 0.3   # typical QFN land length overlap
    for i in range(per_side):
        x = x0 + i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {x:.3f} {pad_y:.3f}) '
            f'(size {params.pad_w:.3f} {params.pad_l:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Right side (pins run bottom→top)
    pad_x = hw + params.pad_l / 2.0 - params.pad_l * 0.3
    y0 = ((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        y = y0 - i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {pad_x:.3f} {y:.3f}) '
            f'(size {params.pad_l:.3f} {params.pad_w:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Top side (pins run right→left)
    pad_y = -(hl + params.pad_l / 2.0 - params.pad_l * 0.3)
    x0_top = ((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        x = x0_top - i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {x:.3f} {pad_y:.3f}) '
            f'(size {params.pad_w:.3f} {params.pad_l:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Left side (pins run top→bottom)
    pad_x = -(hw + params.pad_l / 2.0 - params.pad_l * 0.3)
    y0_left = -((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        y = y0_left + i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {pad_x:.3f} {y:.3f}) '
            f'(size {params.pad_l:.3f} {params.pad_w:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Exposed pad (EP)
    if params.ep_l is not None and params.ep_w is not None:
        lines.append(
            f'  (pad "EP" smd rect (at 0 0) '
            f'(size {params.ep_l:.3f} {params.ep_w:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )

    lines.append(")")
    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────
# QFP
# ─────────────────────────────────────────────────────────────

@dataclass
class QfpParams:
    name: str
    pins: int          # total pin count (must be divisible by 4)
    pitch: float       # mm between pad centres
    body_l: float      # package body length (mm)
    body_w: float      # package body width (mm)
    pad_l: float       # gull-wing land length (mm)
    pad_w: float       # pad width along body edge (mm)
    gullwing_ext: float = 0.5  # how far pads extend beyond body edge (mm)


def generate_qfp(params: QfpParams) -> str:
    """Generate a KiCad 6/7/8 .kicad_mod string for a QFP package."""
    if params.pins % 4 != 0:
        raise ValueError("QFP pin count must be divisible by 4")

    per_side = params.pins // 4
    lines: List[str] = []

    lines.append(f'(module "{params.name}" (layer "F.Cu") (tedit 60000000)')
    lines.append(f'  (descr "QFP-{params.pins}, pitch {params.pitch}mm")')
    lines.append(f'  (fp_text reference "REF**" (at 0 -{params.body_l / 2 + 2.0}) (layer "F.SilkS"))')
    lines.append(f'  (fp_text value "{params.name}" (at 0 {params.body_l / 2 + 2.0}) (layer "F.Fab"))')

    hw = params.body_w / 2.0
    hl = params.body_l / 2.0
    lines.append(f'  (fp_line (start -{hw:.3f} -{hl:.3f}) (end {hw:.3f} -{hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start {hw:.3f} -{hl:.3f}) (end {hw:.3f} {hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start {hw:.3f} {hl:.3f}) (end -{hw:.3f} {hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_line (start -{hw:.3f} {hl:.3f}) (end -{hw:.3f} -{hl:.3f}) (layer "F.SilkS") (width 0.12))')
    lines.append(f'  (fp_circle (center -{hw - 0.4:.3f} -{hl - 0.4:.3f}) (end -{hw - 0.15:.3f} -{hl - 0.4:.3f}) (layer "F.SilkS") (width 0.2))')

    pad_num = 1
    x0 = -((per_side - 1) * params.pitch) / 2.0

    # Bottom row
    pad_y = hl + params.gullwing_ext + params.pad_l / 2.0
    for i in range(per_side):
        x = x0 + i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {x:.3f} {pad_y:.3f}) '
            f'(size {params.pad_w:.3f} {params.pad_l:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Right column
    pad_x = hw + params.gullwing_ext + params.pad_l / 2.0
    y0 = ((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        y = y0 - i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {pad_x:.3f} {y:.3f}) '
            f'(size {params.pad_l:.3f} {params.pad_w:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Top row
    pad_y = -(hl + params.gullwing_ext + params.pad_l / 2.0)
    x0_top = ((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        x = x0_top - i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {x:.3f} {pad_y:.3f}) '
            f'(size {params.pad_w:.3f} {params.pad_l:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    # Left column
    pad_x = -(hw + params.gullwing_ext + params.pad_l / 2.0)
    y0_left = -((per_side - 1) * params.pitch) / 2.0
    for i in range(per_side):
        y = y0_left + i * params.pitch
        lines.append(
            f'  (pad "{pad_num}" smd rect (at {pad_x:.3f} {y:.3f}) '
            f'(size {params.pad_l:.3f} {params.pad_w:.3f}) (layers "F.Cu" "F.Paste" "F.Mask"))'
        )
        pad_num += 1

    lines.append(")")
    return "\n".join(lines) + "\n"
