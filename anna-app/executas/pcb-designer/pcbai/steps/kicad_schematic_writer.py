"""
kicad_schematic_writer.py
Generates a complete KiCad 6+ schematic (.kicad_sch) using the S-expression
format.  No KiCad symbol-library files are required — all symbols are inlined
via the (lib_symbols …) section.

Schematic covers:
  U1  ESP32-C3-MINI-1   – MCU module
  J1  USB-C receptacle  – power + data input
  U2  AP2112K-3.3       – 3.3 V / 600 mA LDO
  U3  BME280            – I²C temp/humidity/pressure sensor
  D1  Status LED        – with R1 (330 Ω) series resistor
  SW1 BOOT button       – GPIO9 → GND
  SW2 RESET button      – EN → GND
  C1–C5  decoupling / filter caps
  R2–R5  pull-ups + USB CC resistors
"""

from __future__ import annotations

import uuid
import os
from typing import Optional


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _uuid() -> str:
    return str(uuid.uuid4())


def _wire(x1: float, y1: float, x2: float, y2: float) -> str:
    return (
        f'  (wire (pts (xy {x1} {y1}) (xy {x2} {y2}))\n'
        f'    (stroke (width 0) (type default))\n'
        f'    (uuid "{_uuid()}")\n'
        f'  )\n'
    )


def _label(net: str, x: float, y: float, angle: float = 0) -> str:
    return (
        f'  (net_label "{net}" (at {x} {y} {angle})\n'
        f'    (fields_autoplaced yes)\n'
        f'    (effects (font (size 1.27 1.27)))\n'
        f'    (uuid "{_uuid()}")\n'
        f'  )\n'
    )


def _pwr_symbol(name: str, x: float, y: float, angle: float = 0) -> str:
    """Place a power-flag / power-port global label."""
    return (
        f'  (global_label "{name}" (shape input) (at {x} {y} {angle})\n'
        f'    (fields_autoplaced yes)\n'
        f'    (effects (font (size 1.27 1.27)) (justify left))\n'
        f'    (uuid "{_uuid()}")\n'
        f'    (property "Intersheet References" "" (at {x} {y} 0)\n'
        f'      (effects (font (size 1.27 1.27)) hide)\n'
        f'    )\n'
        f'  )\n'
    )


def _no_connect(x: float, y: float) -> str:
    return (
        f'  (no_connect (at {x} {y}) (uuid "{_uuid()}"))\n'
    )


# ──────────────────────────────────────────────────────────────────────────────
# Inline symbol library
# ──────────────────────────────────────────────────────────────────────────────

def _lib_symbols() -> str:
    """Return (lib_symbols …) section with simplified symbols for every part."""

    def _pin(name: str, num: int, x: float, y: float,
             angle: int = 0, ptype: str = "bidirectional", plength: float = 2.54) -> str:
        return (
            f'      (pin {ptype} line (at {x} {y} {angle}) (length {plength})\n'
            f'        (name "{name}" (effects (font (size 1.27 1.27))))\n'
            f'        (number "{num}" (effects (font (size 1.27 1.27))))\n'
            f'      )\n'
        )

    def _rect(x1: float, y1: float, x2: float, y2: float) -> str:
        return (
            f'      (rectangle (start {x1} {y1}) (end {x2} {y2})\n'
            f'        (stroke (width 0.254) (type default))\n'
            f'        (fill (type background))\n'
            f'      )\n'
        )

    def _sym(lib: str, name: str, body: str) -> str:
        return (
            f'    (symbol "{lib}:{name}"\n'
            f'      (pin_names (offset 1.016))\n'
            f'      (in_bom yes) (on_board yes)\n'
            f'      (symbol "{lib}_{name}_0_1"\n'
            f'{body}'
            f'      )\n'
            f'    )\n'
        )

    # ESP32-C3-MINI-1 – simplified 10-pin representation
    esp_body = (
        _rect(-7.62, 12.7, 7.62, -12.7) +
        _pin("VCC",     1, -10.16,  10.16,   0,  "power_in") +
        _pin("GND",     2, -10.16,   7.62,   0,  "power_in") +
        _pin("EN",      3, -10.16,   5.08,   0,  "input") +
        _pin("GPIO9",   4, -10.16,   2.54,   0,  "bidirectional") +
        _pin("USB_DP",  5, -10.16,   0.00,   0,  "bidirectional") +
        _pin("USB_DN",  6, -10.16,  -2.54,   0,  "bidirectional") +
        _pin("GPIO6",   7,  10.16,   5.08, 180,  "bidirectional") +
        _pin("GPIO7",   8,  10.16,   2.54, 180,  "bidirectional") +
        _pin("GPIO8",   9,  10.16,   0.00, 180,  "bidirectional") +
        _pin("GPIO10", 10,  10.16,  -2.54, 180,  "bidirectional")
    )

    # AP2112K – SOT-23-5 LDO
    ldo_body = (
        _rect(-3.81, 5.08, 3.81, -5.08) +
        _pin("VIN",  1, -6.35,  2.54,   0, "power_in") +
        _pin("GND",  2, -6.35, -2.54,   0, "power_in") +
        _pin("EN",   3,  6.35,  2.54, 180, "input") +
        _pin("NC",   4,  6.35,  0.00, 180, "no_connect") +
        _pin("VOUT", 5,  6.35, -2.54, 180, "power_out")
    )

    # BME280 – LGA-8
    bme_body = (
        _rect(-3.81, 7.62, 3.81, -7.62) +
        _pin("VDD",  1, -6.35,  5.08,   0, "power_in") +
        _pin("GND",  2, -6.35,  2.54,   0, "power_in") +
        _pin("CSB",  3, -6.35,  0.00,   0, "input") +
        _pin("SDO",  4, -6.35, -2.54,   0, "input") +
        _pin("SDA",  5,  6.35,  2.54, 180, "bidirectional") +
        _pin("SCL",  6,  6.35,  0.00, 180, "input") +
        _pin("VDDIO",7,  6.35, -2.54, 180, "power_in") +
        _pin("GND2", 8,  6.35, -5.08, 180, "power_in")
    )

    # USB-C receptacle (simplified)
    usbc_body = (
        _rect(-3.81, 10.16, 3.81, -10.16) +
        _pin("VBUS",  1, -6.35,  7.62,   0, "power_out") +
        _pin("GND",   2, -6.35,  5.08,   0, "power_in") +
        _pin("D-",    3, -6.35,  2.54,   0, "bidirectional") +
        _pin("D+",    4, -6.35,  0.00,   0, "bidirectional") +
        _pin("CC1",   5, -6.35, -2.54,   0, "passive") +
        _pin("CC2",   6, -6.35, -5.08,   0, "passive") +
        _pin("SHIELD",7,  6.35,  0.00, 180, "passive")
    )

    # Generic LED
    led_body = (
        _rect(-1.27, 1.27, 1.27, -1.27) +
        _pin("A", 1, -3.81, 0,   0, "passive") +
        _pin("K", 2,  3.81, 0, 180, "passive")
    )

    # Generic 2-pin passive (R / C)
    passive_body = (
        _rect(-1.016, 0.762, 1.016, -0.762) +
        _pin("~", 1, -2.54, 0,   0, "passive") +
        _pin("~", 2,  2.54, 0, 180, "passive")
    )

    # Push button (SPST NO)
    sw_body = (
        _rect(-2.54, 1.27, 2.54, -1.27) +
        _pin("A", 1, -5.08, 0,   0, "passive") +
        _pin("B", 2,  5.08, 0, 180, "passive")
    )

    return (
        '  (lib_symbols\n'
        + _sym("pcbai", "ESP32-C3-MINI-1", esp_body)
        + _sym("pcbai", "AP2112K-3.3",     ldo_body)
        + _sym("pcbai", "BME280",          bme_body)
        + _sym("pcbai", "USB_C_Receptacle", usbc_body)
        + _sym("pcbai", "LED",             led_body)
        + _sym("pcbai", "R",               passive_body)
        + _sym("pcbai", "C",               passive_body)
        + _sym("pcbai", "SW_Push",         sw_body)
        + '  )\n'
    )


# ──────────────────────────────────────────────────────────────────────────────
# Component placement helpers
# ──────────────────────────────────────────────────────────────────────────────

def _symbol_instance(
    lib: str, sym: str,
    ref: str, value: str,
    footprint: str,
    x: float, y: float,
    angle: float = 0,
    description: str = "",
    extra_props: Optional[list[tuple[str, str]]] = None,
) -> str:
    uid = _uuid()
    props = (
        f'    (property "Reference" "{ref}" (at {x} {y - 2.54} {angle})\n'
        f'      (effects (font (size 1.27 1.27)))\n'
        f'    )\n'
        f'    (property "Value" "{value}" (at {x} {y + 2.54} {angle})\n'
        f'      (effects (font (size 1.27 1.27)))\n'
        f'    )\n'
        f'    (property "Footprint" "{footprint}" (at {x} {y} {angle})\n'
        f'      (effects (font (size 1.27 1.27)) hide)\n'
        f'    )\n'
        f'    (property "Description" "{description}" (at {x} {y} {angle})\n'
        f'      (effects (font (size 1.27 1.27)) hide)\n'
        f'    )\n'
    )
    if extra_props:
        for pname, pval in extra_props:
            props += (
                f'    (property "{pname}" "{pval}" (at {x} {y} {angle})\n'
                f'      (effects (font (size 1.27 1.27)) hide)\n'
                f'    )\n'
            )
    return (
        f'  (symbol (lib_id "{lib}:{sym}") (at {x} {y} {angle})\n'
        f'    (unit 1)\n'
        f'    (in_bom yes) (on_board yes) (dnp no)\n'
        f'    (uuid "{uid}")\n'
        + props +
        f'  )\n'
    )


# ──────────────────────────────────────────────────────────────────────────────
# Main generator
# ──────────────────────────────────────────────────────────────────────────────

def generate_schematic(output_path: str) -> None:
    """
    Write a complete KiCad 6 schematic (.kicad_sch) for the ESP32-C3 sensor
    board to *output_path*.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    lines: list[str] = []

    # ── Header ────────────────────────────────────────────────────────────────
    lines.append(
        '(kicad_sch\n'
        '  (version 20231120)\n'
        '  (generator "pcbai")\n'
        '  (generator_version "0.2.1")\n'
        f'  (uuid "{_uuid()}")\n'
        '  (paper "A3")\n'
        '  (title_block\n'
        '    (title "ESP32-C3 Sensor Board")\n'
        '    (rev "v0.2.1")\n'
        '    (company "pcb-designer-ai-agent")\n'
        '    (comment 1 "Auto-generated by pcbai design_compiler")\n'
        '  )\n'
    )

    # ── Inline symbol library ──────────────────────────────────────────────────
    lines.append(_lib_symbols())

    # ──────────────────────────────────────────────────────────────────────────
    # Component instances
    # Grid: origin top-left; X increases right, Y increases down (KiCad mils)
    # We use mm-equivalent in KiCad sch units (1 unit ≈ 1 mm at 50 mil grid)
    # ──────────────────────────────────────────────────────────────────────────

    # J1 – USB-C  (top-left area)
    lines.append(_symbol_instance(
        "pcbai", "USB_C_Receptacle",
        "J1", "USB4085-GF-A",
        "Connector_USB:USB_C_Receptacle_GCT_USB4085",
        x=30, y=30,
        description="USB Type-C 2.0 Receptacle"
    ))

    # U2 – AP2112K LDO  (middle-left)
    lines.append(_symbol_instance(
        "pcbai", "AP2112K-3.3",
        "U2", "AP2112K-3.3TRG1",
        "Package_TO_SOT_SMD:SOT-23-5",
        x=70, y=30,
        description="3.3V 600mA LDO"
    ))

    # U1 – ESP32-C3-MINI-1 (center)
    lines.append(_symbol_instance(
        "pcbai", "ESP32-C3-MINI-1",
        "U1", "ESP32-C3-MINI-1",
        "RF_Module:ESP32-C3-WROOM-02",
        x=120, y=50,
        description="WiFi+BLE SoC module"
    ))

    # U3 – BME280  (right side)
    lines.append(_symbol_instance(
        "pcbai", "BME280",
        "U3", "BME280",
        "Package_LGA:Bosch_LGA-8_2.5x2.5mm_P0.65mm_ClockwisePinNumbering",
        x=170, y=60,
        description="Temp/Humidity/Pressure sensor"
    ))

    # D1 – LED
    lines.append(_symbol_instance(
        "pcbai", "LED",
        "D1", "APHHS1005CGCK",
        "LED_SMD:LED_0402_1005Metric",
        x=170, y=30,
        description="Green status LED"
    ))

    # R1 – 330 Ω LED series resistor
    lines.append(_symbol_instance(
        "pcbai", "R",
        "R1", "330R",
        "Resistor_SMD:R_0402_1005Metric",
        x=150, y=30,
        description="LED series resistor"
    ))

    # C1, C2 – 100 nF decoupling on LDO output
    lines.append(_symbol_instance(
        "pcbai", "C", "C1", "100nF",
        "Capacitor_SMD:C_0402_1005Metric",
        x=90, y=15, description="LDO output decoupling"
    ))
    lines.append(_symbol_instance(
        "pcbai", "C", "C2", "100nF",
        "Capacitor_SMD:C_0402_1005Metric",
        x=100, y=15, description="LDO output decoupling"
    ))

    # C3 – 10 µF bulk
    lines.append(_symbol_instance(
        "pcbai", "C", "C3", "10uF",
        "Capacitor_SMD:C_0402_1005Metric",
        x=110, y=15, description="LDO bulk capacitor"
    ))

    # C4, C5 – VBUS filter
    lines.append(_symbol_instance(
        "pcbai", "C", "C4", "100nF",
        "Capacitor_SMD:C_0402_1005Metric",
        x=30, y=15, description="VBUS filter cap"
    ))
    lines.append(_symbol_instance(
        "pcbai", "C", "C5", "100nF",
        "Capacitor_SMD:C_0402_1005Metric",
        x=40, y=15, description="VBUS filter cap"
    ))

    # SW1 – BOOT
    lines.append(_symbol_instance(
        "pcbai", "SW_Push", "SW1", "BOOT",
        "Button_Switch_SMD:SW_Push_1P1T_NO_CK_KSC9xxG",
        x=100, y=90, description="BOOT button (GPIO9→GND)"
    ))

    # SW2 – RESET
    lines.append(_symbol_instance(
        "pcbai", "SW_Push", "SW2", "RESET",
        "Button_Switch_SMD:SW_Push_1P1T_NO_CK_KSC9xxG",
        x=120, y=90, description="RESET button (EN→GND)"
    ))

    # R2, R3 – I2C pull-ups
    lines.append(_symbol_instance(
        "pcbai", "R", "R2", "4K7",
        "Resistor_SMD:R_0402_1005Metric",
        x=155, y=55, description="I2C SCL pull-up"
    ))
    lines.append(_symbol_instance(
        "pcbai", "R", "R3", "4K7",
        "Resistor_SMD:R_0402_1005Metric",
        x=155, y=60, description="I2C SDA pull-up"
    ))

    # R4, R5 – USB CC
    lines.append(_symbol_instance(
        "pcbai", "R", "R4", "5K1",
        "Resistor_SMD:R_0402_1005Metric",
        x=30, y=45, description="USB CC1 resistor"
    ))
    lines.append(_symbol_instance(
        "pcbai", "R", "R5", "5K1",
        "Resistor_SMD:R_0402_1005Metric",
        x=40, y=45, description="USB CC2 resistor"
    ))

    # ── Net labels / global power labels ──────────────────────────────────────
    # VBUS rail
    for px, py in [(30, 22), (30, 22), (35, 22)]:
        lines.append(_pwr_symbol("VBUS", px, py, 270))

    # +3V3 rail
    for px, py in [(70, 22), (90, 8), (100, 8), (110, 8), (150, 25), (155, 50), (155, 55), (170, 52)]:
        lines.append(_pwr_symbol("+3V3", px, py, 270))

    # GND
    for px, py in [(30, 38), (70, 38), (100, 100), (120, 100), (170, 70)]:
        lines.append(_pwr_symbol("GND", px, py, 90))

    # Net labels for signal nets
    lines.append(_label("VBUS",     36, 30))
    lines.append(_label("VBUS",     70, 25))
    lines.append(_label("+3V3",     70, 34))
    lines.append(_label("+3V3",    113, 50))
    lines.append(_label("USB_DP",   55, 30))
    lines.append(_label("USB_DP",  113, 47))
    lines.append(_label("USB_DN",   55, 32))
    lines.append(_label("USB_DN",  113, 50))
    lines.append(_label("I2C_SCL", 113, 55))
    lines.append(_label("I2C_SCL", 163, 55))
    lines.append(_label("I2C_SDA", 113, 57))
    lines.append(_label("I2C_SDA", 163, 60))
    lines.append(_label("BOOT_BTN", 93, 90))
    lines.append(_label("BOOT_BTN", 113, 52))
    lines.append(_label("nRESET",  113, 50))
    lines.append(_label("nRESET",  113, 45))
    lines.append(_label("LED_NET", 143, 30))

    # ── Wires ─────────────────────────────────────────────────────────────────
    # VBUS: J1 → C4, C5
    lines.append(_wire(36, 30, 50, 30))   # J1 VBUS out → …
    lines.append(_wire(36, 30, 36, 22))   # → VBUS power symbol
    lines.append(_wire(50, 30, 64, 30))   # → U2 VIN

    # +3V3: U2 VOUT → C1/C2/C3
    lines.append(_wire(76, 27, 90, 27))
    lines.append(_wire(90, 27, 90, 15))
    lines.append(_wire(90, 15, 100, 15))
    lines.append(_wire(100, 15, 110, 15))

    # +3V3 → U1 VCC
    lines.append(_wire(90, 27, 90, 50))
    lines.append(_wire(90, 50, 113, 50))

    # LED: +3V3 → R1 → D1
    lines.append(_wire(148, 30, 143, 30))   # R1 pin 1 ← net LED_NET side
    lines.append(_wire(152, 30, 163, 30))   # R1 pin 2 → D1 anode
    lines.append(_wire(163, 30, 173, 30))   # D1 cathode → …

    # I2C: U1 GPIO6 → R2 → U3 SCL
    lines.append(_wire(127, 55, 153, 55))
    lines.append(_wire(157, 55, 163, 55))

    # I2C: U1 GPIO7 → R3 → U3 SDA
    lines.append(_wire(127, 57, 153, 57))
    lines.append(_wire(157, 57, 163, 57))

    # BOOT: SW1 → U1 GPIO9
    lines.append(_wire(95, 90, 113, 90))
    lines.append(_wire(113, 90, 113, 52))

    # RESET: SW2 → U1 EN
    lines.append(_wire(115, 90, 127, 90))
    lines.append(_wire(113, 90, 113, 45))

    # ── No-connects ────────────────────────────────────────────────────────────
    lines.append(_no_connect(176, 30))    # LED cathode no-connect (GND via pour)
    lines.append(_no_connect(127, 47))    # ESP GPIO10 NC
    lines.append(_no_connect(170, 52))    # BME CSB (tied high externally)

    # ── Footer ────────────────────────────────────────────────────────────────
    lines.append(')\n')

    with open(output_path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)

    print(f"[kicad_schematic_writer] Wrote {output_path}")
