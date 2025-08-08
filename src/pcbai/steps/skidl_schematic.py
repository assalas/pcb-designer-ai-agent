from __future__ import annotations

from typing import List, Dict

try:
    from skidl import Part, Net, ERC, generate_netlist, subcircuit
except Exception:  # pragma: no cover
    Part = Net = ERC = generate_netlist = subcircuit = None  # type: ignore


def bom_to_schematic(bom: List[Dict]) -> str:
    """Create a simple SKiDL netlist if SKiDL is available.

    Returns a textual netlist (XML) or a message if SKiDL isn't installed.
    """
    if Part is None:
        return "SKiDL not installed. Install with `pip install skidl` to enable schematic generation."

    # Example: connect all parts to VCC and GND nets.
    vcc = Net('VCC')
    gnd = Net('GND')

    refs = []
    for i, p in enumerate(bom, start=1):
        # Generic part symbol; in reality, we'd map MPN/package to SKiDL libs
        part = Part('Device', 'U', value=p.get('mpn', 'U'), ref=f'U{i}', footprint=p.get('package', ''))
        vcc += part['1']
        gnd += part['2']
        refs.append(part.ref)

    ERC();
    return generate_netlist()
