from __future__ import annotations

from typing import List, Dict

try:
    from skidl import Part, Net, ERC, generate_netlist, SKIDL, Pin
except Exception:  # pragma: no cover
    Part = Net = ERC = generate_netlist = SKIDL = Pin = None  # type: ignore


def _make_generic_part(mpn: str, package: str, ref: str) -> "Part":
    """Create a self-contained generic IC part using the SKIDL tool.

    No KiCad symbol library files required.
    """
    return Part(
        tool=SKIDL,
        name=mpn,
        footprint=package,
        ref=ref,
        pins=[
            Pin(num=1, name="VIN",  func=Pin.types.PWRIN),
            Pin(num=2, name="GND",  func=Pin.types.PWRIN),
            Pin(num=3, name="OUT",  func=Pin.types.OUTPUT),
            Pin(num=4, name="EN",   func=Pin.types.INPUT),
        ],
    )


def _make_passive(name: str, ref: str, value: str, footprint: str) -> "Part":
    """Create a generic 2-pin passive (R/C/L) without library lookup."""
    p = Part(
        tool=SKIDL,
        name=name,
        footprint=footprint,
        ref=ref,
        pins=[
            Pin(num=1, name="A", func=Pin.types.PASSIVE),
            Pin(num=2, name="B", func=Pin.types.PASSIVE),
        ],
    )
    p.value = value
    return p


def _add_buck_support(vcc_net, gnd_net, part):
    """Add input/output passives for a buck converter."""
    cin  = _make_passive("C", "Cin",  "10uF", "C_0805_2012Metric")
    cout = _make_passive("C", "Cout", "22uF", "C_0805_2012Metric")
    ind  = _make_passive("L", "L1",   "10uH", "L_0603_1608Metric")

    vcc_net += cin["A"],  part["VIN"]
    gnd_net += cin["B"]
    sw_net = Net("SW")
    sw_net  += part["OUT"], ind["A"]
    vout    = Net("VOUT")
    vout    += ind["B"], cout["A"]
    gnd_net += cout["B"]


def _add_mcu_decoupling(vcc_net, gnd_net, part):
    """Add decoupling capacitors for an MCU."""
    for i in range(1, 3):
        c = _make_passive("C", f"Cdec{i}", "100nF", "C_0402_1005Metric")
        vcc_net += c["A"]
        gnd_net += c["B"]
    bulk = _make_passive("C", "Cbulk", "10uF", "C_0603_1608Metric")
    vcc_net += bulk["A"]
    gnd_net += bulk["B"]
    vcc_net += part["VIN"]
    gnd_net += part["GND"]


def bom_to_schematic(bom: List[Dict]) -> str:
    """Create a SKiDL netlist from BOM.

    Uses self-contained SKIDL-tool parts — no KiCad symbol library files needed.
    Returns a netlist XML string, or an install message if SKiDL is missing.
    """
    if Part is None:
        return "SKiDL not installed. Install with `pip install skidl` to enable schematic generation."

    vcc = Net("VCC")
    gnd = Net("GND")

    refs = []
    for i, p in enumerate(bom, start=1):
        mpn     = p.get("mpn", f"U{i}")
        package = p.get("package", "")
        part    = _make_generic_part(mpn, package, f"U{i}")
        part.value = mpn

        mpn_lower = mpn.lower()
        if any(k in mpn_lower for k in ("buck", "mp1584", "lm2596")):
            _add_buck_support(vcc, gnd, part)
        elif any(k in mpn_lower for k in ("mcu", "stm32", "esp32", "atmega")):
            _add_mcu_decoupling(vcc, gnd, part)
        else:
            vcc += part["VIN"]
            gnd += part["GND"]

        refs.append(part.ref)

    try:
        ERC()
    except Exception as e:
        print(f"ERC failed (often due to stub parts): {e}")

    return generate_netlist()
