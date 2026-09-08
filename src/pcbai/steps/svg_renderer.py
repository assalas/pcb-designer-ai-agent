from __future__ import annotations
from typing import List, Dict, Any, Tuple

class SVGRenderer:
    def __init__(self, width: int = 800, height: int = 800, scale: float = 20.0):
        self.width = width
        self.height = height
        self.scale = scale
        self.elements: List[str] = []
        self.cx = width / 2.0
        self.cy = height / 2.0

        # We enforce a flat, editorial design style (no shadows, high contrast)
        self.style = """
        <style>
            .background { fill: #f0f4f8; }
            .pad-rect { fill: #d32f2f; stroke: #b71c1c; stroke-width: 2px; }
            .pad-circle { fill: #d32f2f; stroke: #b71c1c; stroke-width: 2px; }
            .pad-drill { fill: #f0f4f8; stroke: #b71c1c; stroke-width: 1px; }
            .fab-outline { fill: none; stroke: #263238; stroke-width: 1.5px; stroke-dasharray: 4 2; }
            .silk-outline { fill: none; stroke: #0277bd; stroke-width: 2px; }
            .silk-dot { fill: #0277bd; }
            .text-label { font-family: monospace; font-size: 10px; fill: #ffffff; text-anchor: middle; dominant-baseline: central; }
            .title { font-family: sans-serif; font-size: 20px; font-weight: bold; fill: #263238; }
        </style>
        """

    def _transform(self, x: float, y: float) -> Tuple[float, float]:
        """Convert logical mm coordinates to SVG screen coordinates, centered."""
        return self.cx + (x * self.scale), self.cy + (y * self.scale)

    def draw_pad_rect(self, name: str, x: float, y: float, w: float, h: float, drill: float = 0.0):
        sx, sy = self._transform(x - w/2, y - h/2)
        sw, sh = w * self.scale, h * self.scale
        self.elements.append(f'<rect x="{sx:.2f}" y="{sy:.2f}" width="{sw:.2f}" height="{sh:.2f}" rx="2" class="pad-rect"/>')
        if drill > 0:
            cx, cy = self._transform(x, y)
            r = (drill / 2) * self.scale
            self.elements.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" class="pad-drill"/>')
        # Add label
        cx, cy = self._transform(x, y)
        self.elements.append(f'<text x="{cx:.2f}" y="{cy:.2f}" class="text-label">{name}</text>')

    def draw_pad_circle(self, name: str, x: float, y: float, dia: float, drill: float = 0.0):
        cx, cy = self._transform(x, y)
        r = (dia / 2) * self.scale
        self.elements.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" class="pad-circle"/>')
        if drill > 0:
            dr = (drill / 2) * self.scale
            self.elements.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{dr:.2f}" class="pad-drill"/>')
        self.elements.append(f'<text x="{cx:.2f}" y="{cy:.2f}" class="text-label">{name}</text>')

    def draw_fab_rect(self, w: float, h: float):
        x, y = self._transform(-w/2, -h/2)
        sw, sh = w * self.scale, h * self.scale
        self.elements.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{sw:.2f}" height="{sh:.2f}" class="fab-outline"/>')

    def draw_silk_dot(self, x: float, y: float, r: float = 0.4):
        cx, cy = self._transform(x, y)
        sr = r * self.scale
        self.elements.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{sr:.2f}" class="silk-dot"/>')

    def render(self, title: str) -> str:
        svg_content = "\n".join(self.elements)
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Footprint Preview: {title}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #e0e6ed; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <svg width="{self.width}" height="{self.height}" xmlns="http://www.w3.org/2000/svg">
            {self.style}
            <rect width="100%" height="100%" class="background" rx="8"/>
            <text x="20" y="40" class="title">{title}</text>
            {svg_content}
        </svg>
    </div>
</body>
</html>
"""
        return html
