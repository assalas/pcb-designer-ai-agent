from __future__ import annotations

from dataclasses import dataclass
from typing import List
import os
from pcbai.steps.svg_renderer import SVGRenderer

@dataclass
class DipParams:
    name: str
    pins: int
    pitch: float
    row_spacing: float
    body_l: float
    body_w: float
    pad_dia: float
    drill_dia: float


class KiCadModuleWriter:
    def __init__(self, libdir: str):
        self.libdir = libdir
        os.makedirs(self.libdir, exist_ok=True)

    def write(self, name: str, content: str) -> str:
        path = os.path.join(self.libdir, f"{name}.kicad_mod")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path


def generate_dip(params: DipParams) -> str:
    lines, _ = _generate_dip_impl(params)
    return "\n".join(lines) + "\n"

def generate_dip_svg(params: DipParams) -> str:
    _, renderer = _generate_dip_impl(params)
    return renderer.render(f"DIP Footprint: {params.name}")

def _generate_dip_impl(params: DipParams) -> tuple[List[str], SVGRenderer]:
    if params.pins % 2 != 0:
        raise ValueError("DIP pins must be even")

    pins_per_side = params.pins // 2

    lines: List[str] = []
    renderer = SVGRenderer(scale=25.0)
    lines.append(f"(module {params.name} (layer F.Cu) (tedit 5B3079AF)")
    lines.append("  (attr through_hole)")

    # Body fab outline
    hw = params.body_w / 2.0
    hl = params.body_l / 2.0

    renderer.draw_fab_rect(params.body_l, params.body_w)
    renderer.draw_silk_dot(-hl + 0.6, -hw - 0.6)

    # DIP origin is typically pin 1, but lets stick to center origin for consistency with other generators
    # We will offset pads around the center.

    fab = [(-hl, -hw), (hl, -hw), (hl, hw), (-hl, hw), (-hl, -hw)]
    for i in range(4):
        x1, y1 = fab[i]
        x2, y2 = fab[i+1]
        lines.append(f"  (fp_line (start {x1:.3f} {y1:.3f}) (end {x2:.3f} {y2:.3f}) (layer F.Fab) (width 0.1))")

    # Pin 1 marker notch or dot on Fab/Silk
    lines.append(f"  (fp_arc (start {-hl:.3f} 0) (end {-hl:.3f} -0.5) (angle 180) (layer F.Fab) (width 0.1))")
    lines.append(f"  (fp_circle (center {-hl+0.6:.3f} {-hw-0.6:.3f}) (end {-hl+0.3:.3f} {-hw-0.6:.3f}) (layer F.SilkS) (width 0.2))")

    # Pads
    top_y = -params.row_spacing / 2.0  # Top row
    bot_y = params.row_spacing / 2.0   # Bottom row (Pin 1 is here)

    x0 = - (params.pitch * (pins_per_side - 1)) / 2.0

    for i in range(pins_per_side):
        x = x0 + i * params.pitch
        pad_num_bot = 1 + i                  # Bottom row, left-to-right (1 to N/2)
        pad_num_top = params.pins - i        # Top row, right-to-left (N to N/2 + 1)

        # Pin 1 is usually rectangular in THT libraries, others circular or oval
        shape_bot = "rect" if pad_num_bot == 1 else "circle"

        lines.append(
            f"  (pad {pad_num_top} thru_hole circle (at {x:.3f} {top_y:.3f}) "
            f"(size {params.pad_dia:.3f} {params.pad_dia:.3f}) (drill {params.drill_dia:.3f}) (layers *.Cu *.Mask))"
        )
        lines.append(
            f"  (pad {pad_num_bot} thru_hole {shape_bot} (at {x:.3f} {bot_y:.3f}) "
            f"(size {params.pad_dia:.3f} {params.pad_dia:.3f}) (drill {params.drill_dia:.3f}) (layers *.Cu *.Mask))"
        )

        # Draw on SVG
        renderer.draw_pad_circle(str(pad_num_top), x, top_y, params.pad_dia, params.drill_dia)
        if shape_bot == "rect":
            renderer.draw_pad_rect(str(pad_num_bot), x, bot_y, params.pad_dia, params.pad_dia, params.drill_dia)
        else:
            renderer.draw_pad_circle(str(pad_num_bot), x, bot_y, params.pad_dia, params.drill_dia)

    lines.append(")")
    return lines, renderer
