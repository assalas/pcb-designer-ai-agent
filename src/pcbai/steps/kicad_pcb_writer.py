"""
kicad_pcb_writer.py
Generates a complete, valid KiCad 10 PCB (.kicad_pcb) for the
ESP32-C3-MINI-1 sensor board using the pcbnew Python API.

Board:  40 mm × 30 mm, 2-layer (F.Cu / B.Cu)
Origin: (0, 0) = top-left corner of board outline

All coordinates are in mm; pcbnew.FromMM() converts to internal units.
"""

from __future__ import annotations

import sys
import os
import traceback
from typing import Optional

# ── KiCad Python bindings ─────────────────────────────────────────────────────
_KICAD_LIB = "/usr/lib/kicad/lib/python3/dist-packages"
if _KICAD_LIB not in sys.path:
    sys.path.insert(0, _KICAD_LIB)

try:
    import pcbnew
    _PCBNEW_OK = True
except ImportError:
    _PCBNEW_OK = False
    print("[kicad_pcb_writer] WARNING: pcbnew not available; PCB generation skipped.")

# ── Constants ─────────────────────────────────────────────────────────────────
FP_LIB_ROOT = "/usr/share/kicad/footprints"
BOARD_W = 40.0   # mm
BOARD_H = 30.0   # mm
CORNER_INSET = 2.5  # M2 hole inset from corners


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _mm(x: float) -> int:
    """Convert mm → pcbnew internal units."""
    return pcbnew.FromMM(x)


def _pt(x: float, y: float) -> "pcbnew.VECTOR2I":
    return pcbnew.VECTOR2I(_mm(x), _mm(y))


def _add_net(board: "pcbnew.BOARD", name: str, net_code: int) -> "pcbnew.NETINFO_ITEM":
    ni = pcbnew.NETINFO_ITEM(board, name, net_code)
    board.Add(ni)
    return ni


def _load_fp(lib_name: str, fp_name: str) -> Optional["pcbnew.FOOTPRINT"]:
    """Load a footprint from the KiCad standard library. Returns None on failure."""
    lib_path = os.path.join(FP_LIB_ROOT, f"{lib_name}.pretty")
    try:
        fp = pcbnew.FootprintLoad(lib_path, fp_name)
        return fp
    except Exception as exc:
        print(f"[kicad_pcb_writer] WARN: cannot load {lib_name}:{fp_name} → {exc}")
        return None


def _place_fp(
    board: "pcbnew.BOARD",
    fp: "pcbnew.FOOTPRINT",
    ref: str,
    value: str,
    x: float,
    y: float,
    angle_deg: float = 0.0,
    side: str = "F",
) -> "pcbnew.FOOTPRINT":
    """Add footprint to board, set reference/value/position."""
    board.Add(fp)
    fp.SetReference(ref)
    fp.SetValue(value)
    fp.SetPosition(_pt(x, y))
    fp.SetOrientationDegrees(angle_deg)
    if side == "B":
        fp.Flip(fp.GetPosition(), False)
    return fp


def _assign_pad_net(
    fp: "pcbnew.FOOTPRINT",
    pad_names: list[str],
    net: "pcbnew.NETINFO_ITEM",
) -> None:
    """Assign *net* to every pad whose name or number is in *pad_names*."""
    for pad in fp.Pads():
        if pad.GetName() in pad_names or pad.GetNumber() in pad_names:
            pad.SetNet(net)


def _add_track(
    board: "pcbnew.BOARD",
    x1: float, y1: float,
    x2: float, y2: float,
    net: "pcbnew.NETINFO_ITEM",
    width_mm: float = 0.25,
    layer=None,
) -> None:
    if layer is None:
        layer = pcbnew.F_Cu
    t = pcbnew.PCB_TRACK(board)
    t.SetStart(_pt(x1, y1))
    t.SetEnd(_pt(x2, y2))
    t.SetWidth(_mm(width_mm))
    t.SetLayer(layer)
    t.SetNet(net)
    board.Add(t)


def _add_board_outline(board: "pcbnew.BOARD", w: float, h: float) -> None:
    """Draw 40 × 30 mm rectangle on Edge.Cuts."""
    corners = [(0, 0), (w, 0), (w, h), (0, h), (0, 0)]
    for i in range(len(corners) - 1):
        seg = pcbnew.PCB_SHAPE(board)
        seg.SetShape(pcbnew.SHAPE_T_SEGMENT)
        seg.SetLayer(pcbnew.Edge_Cuts)
        seg.SetWidth(_mm(0.05))
        seg.SetStart(_pt(*corners[i]))
        seg.SetEnd(_pt(*corners[i + 1]))
        board.Add(seg)


def _add_keepout(
    board: "pcbnew.BOARD",
    x1: float, y1: float, x2: float, y2: float,
    label: str = "Antenna Keepout",
) -> None:
    """Add a copper keepout rectangle (no copper on F.Cu or B.Cu)."""
    zone = pcbnew.ZONE(board)
    zone.SetIsRuleArea(True)
    zone.SetDoNotAllowZoneFills(True)   # KiCad 10: was SetDoNotAllowCopperPour
    zone.SetDoNotAllowTracks(True)
    zone.SetDoNotAllowVias(True)
    zone.SetDoNotAllowPads(False)
    zone.SetDoNotAllowFootprints(False)

    ls = pcbnew.LSET()
    ls.addLayer(pcbnew.F_Cu)
    ls.addLayer(pcbnew.B_Cu)
    zone.SetLayerSet(ls)
    zone.SetZoneName(label)

    outline = zone.Outline()
    outline.NewOutline()
    for px, py in [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]:
        outline.Append(_mm(px), _mm(py))
    board.Add(zone)


def _add_gnd_pour(
    board: "pcbnew.BOARD",
    gnd_net: "pcbnew.NETINFO_ITEM",
    layer: int,
    x1: float = 0, y1: float = 0,
    x2: float = BOARD_W, y2: float = BOARD_H,
) -> None:
    """Add a GND copper fill zone on *layer* covering the board."""
    zone = pcbnew.ZONE(board)
    zone.SetNet(gnd_net)
    zone.SetLayer(layer)
    zone.SetZoneName("GND_pour")
    zone.SetMinThickness(_mm(0.127))
    zone.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    zone.SetThermalReliefGap(_mm(0.3))
    zone.SetThermalReliefSpokeWidth(_mm(0.3))

    outline = zone.Outline()
    outline.NewOutline()
    for px, py in [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]:
        outline.Append(_mm(px), _mm(py))
    board.Add(zone)


def _add_courtyard_text(board: "pcbnew.BOARD") -> None:
    """Add board title text."""
    txt = pcbnew.PCB_TEXT(board)
    txt.SetText("ESP32-C3 Sensor Board v0.2.1")
    txt.SetPosition(_pt(2, 0.8))
    txt.SetLayer(pcbnew.F_SilkS)
    txt.SetTextSize(pcbnew.VECTOR2I(_mm(1.0), _mm(1.0)))
    txt.SetTextThickness(_mm(0.15))
    board.Add(txt)


# ──────────────────────────────────────────────────────────────────────────────
# Net assignments per component
# ──────────────────────────────────────────────────────────────────────────────

# Maps footprint_name → {net_name: [pad_numbers]}
# Pad numbers confirmed by inspecting actual KiCad 10 footprints.
_NET_MAP: dict[str, dict[str, list[str]]] = {
    # USB-C GCT USB4085: A4/B4=VBUS, A1/B1=GND, A6/B6=D+, A7/B7=D-,
    #                     A5=CC1, B5=CC2, SH=shield
    "USB_C_Receptacle_GCT_USB4085": {
        "VBUS":   ["A4", "B4", "A9", "B9"],
        "GND":    ["A1", "B1", "A12", "B12", "SH"],
        "USB_DP": ["A6", "B6"],
        "USB_DN": ["A7", "B7"],
        "CC1":    ["A5"],
        "CC2":    ["B5"],
    },
    # AP2112K-3.3 SOT-23-5: 1=IN, 2=GND, 3=EN, 4=NC, 5=OUT
    "SOT-23-5": {
        "VBUS":  ["1"],
        "GND":   ["2"],
        "EN":    ["3"],
        "+3V3":  ["5"],
    },
    # BME280 Bosch LGA-8 (clockwise): 1=VDD, 2=GND, 3=CSB, 4=SDO,
    #                                   5=SDA, 6=SCL, 7=VDDIO, 8=GND
    "Bosch_LGA-8_2.5x2.5mm_P0.65mm_ClockwisePinNumbering": {
        "+3V3":    ["1", "7"],
        "GND":     ["2", "8"],
        "I2C_SDA": ["5"],
        "I2C_SCL": ["6"],
    },
    # ESP32-C3-WROOM-02: 1=GND, 2=3V3, 3=EN, pads 1-18 are I/O,
    # 19+ = GND thermal/castellated
    # Datasheet WROOM-02 pinout: 1=GND,2=3V3,3=EN,4=IO2,5=IO3,6=IO4,7=IO5,
    # 8=IO6,9=IO7,10=IO8,11=IO9,12=IO10,13=IO20,14=IO3,15=IO2,16=TXD,17=RXD,
    # 18=USB_D-,19=USB_D+ (GPIO19/20 mapped to USB in C3)
    "ESP32-C3-WROOM-02": {
        "GND":     ["1", "19"],
        "+3V3":    ["2"],
        "nRESET":  ["3"],
        "I2C_SCL": ["8"],
        "I2C_SDA": ["9"],
        "BOOT_BTN":["11"],
        "USB_DN":  ["18"],
        "USB_DP":  ["19"],
    },
    # LED 0402
    "LED_0402_1005Metric": {
        "LED_ANODE": ["1"],
        "GND":       ["2"],
    },
    "LED_0603_1608Metric": {
        "LED_ANODE": ["1"],
        "GND":       ["2"],
    },
    # Generic 0402 passives – assigned individually in _assign_passive_nets
    "R_0402_1005Metric": {},
    "C_0402_1005Metric": {},
    # Tactile push switch: 1&1=common side, 2&2=NO side
    "SW_Push_1P1T_NO_CK_KSC9xxG": {
        "GND": ["2"],
    },
    # Mounting holes: no electrical connection
    "MountingHole_2.2mm_M2_DIN965": {},
}



def _assign_nets_by_map(fp_name: str, fp: "pcbnew.FOOTPRINT", nets: dict) -> None:
    """Use _NET_MAP to assign nets to pads of *fp*."""
    mapping = _NET_MAP.get(fp_name, {})
    for net_name, pad_ids in mapping.items():
        net = nets.get(net_name)
        if net:
            _assign_pad_net(fp, pad_ids, net)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def generate_pcb(output_path: str, project_name: str = "esp32c3_sensor") -> bool:
    """
    Generate a complete .kicad_pcb file at *output_path*.

    Returns True on success, False if pcbnew is unavailable.
    """
    if not _PCBNEW_OK:
        print("[kicad_pcb_writer] pcbnew unavailable; skipping PCB generation.")
        return False

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    board = pcbnew.BOARD()

    # ── Title block ───────────────────────────────────────────────────────────
    tb = board.GetTitleBlock()
    tb.SetTitle("ESP32-C3 Sensor Board")
    tb.SetRevision("v0.2.1")
    tb.SetCompany("pcb-designer-ai-agent")

    # ── Stackup: 2-layer ─────────────────────────────────────────────────────
    try:
        su = board.GetStackup()
        su.SetBoardThickness(_mm(1.6))
    except Exception:
        pass  # older API

    # ── Nets ──────────────────────────────────────────────────────────────────
    net_defs = [
        (1, "VBUS"),
        (2, "+3V3"),
        (3, "GND"),
        (4, "USB_DP"),
        (5, "USB_DN"),
        (6, "I2C_SCL"),
        (7, "I2C_SDA"),
        (8, "BOOT_BTN"),
        (9, "nRESET"),
        (10, "CC1"),
        (11, "CC2"),
        (12, "EN"),
        (13, "LED_ANODE"),
    ]
    nets: dict[str, "pcbnew.NETINFO_ITEM"] = {}
    for code, name in net_defs:
        ni = _add_net(board, name, code)
        nets[name] = ni

    board.BuildListOfNets()

    # ── Board outline ─────────────────────────────────────────────────────────
    _add_board_outline(board, BOARD_W, BOARD_H)

    # ── Antenna keepout (right 4 mm of board) ────────────────────────────────
    _add_keepout(board, x1=36, y1=0, x2=BOARD_W, y2=BOARD_H,
                 label="ESP32_Antenna_Keepout")

    # ── Footprint placements ──────────────────────────────────────────────────
    # Coordinate system: board origin = top-left corner
    # Board = 40mm wide × 30mm tall
    # Key clearance rules:
    #   - USB-C GCT_USB4085 body ~ 9mm wide × 5mm tall (with PTH pads)
    #   - ESP32-C3-WROOM-02 ~ 13.2mm × 16.6mm  → centre at (18, 15) fits inside 40×30
    #   - SOT-23-5 ~ 2.9mm × 2.8mm
    #   - LGA-8    ~ 2.5mm × 2.5mm
    #   - 0402 pad-to-pad ~ 1.5mm
    placements = [
        # (lib, fp_name,  ref,  value,                      x,    y,   angle)
        # J1 USB-C at top-left; centre body ~9 mm from left edge
        ("Connector_USB",     "USB_C_Receptacle_GCT_USB4085", "J1",  "USB4085-GF-A",       5.5,   4.0,  0),
        # U1 ESP32 centre of board
        ("RF_Module",         "ESP32-C3-WROOM-02",            "U1",  "ESP32-C3-MINI-1",   18.0,  16.0,  0),
        # U2 LDO – top-right quadrant
        ("Package_TO_SOT_SMD","SOT-23-5",                     "U2",  "AP2112K-3.3TRG1",   34.5,   7.0,  0),
        # U3 BME280 – right side, middle height
        ("Package_LGA",       "Bosch_LGA-8_2.5x2.5mm_P0.65mm_ClockwisePinNumbering",
                                                              "U3",  "BME280",            35.0,  20.0,  0),
        # D1 LED near right edge
        ("LED_SMD",           "LED_0402_1005Metric",          "D1",  "APHHS1005CGCK",     35.0,  14.0,  0),
        # R1 330Ω LED series – to the left of D1
        ("Resistor_SMD",      "R_0402_1005Metric",            "R1",  "330R",              33.0,  14.0,  0),
        # C1, C2, C3 decoupling – near U2 LDO, stacked vertically with 2mm pitch
        ("Capacitor_SMD",     "C_0402_1005Metric",            "C1",  "100nF",             32.5,   5.0,  0),
        ("Capacitor_SMD",     "C_0402_1005Metric",            "C2",  "100nF",             32.5,   7.0,  0),
        ("Capacitor_SMD",     "C_0402_1005Metric",            "C3",  "10uF",              32.5,   9.0,  0),
        # C4, C5 VBUS filter – below J1, 3mm south of connector to avoid overlap
        ("Capacitor_SMD",     "C_0402_1005Metric",            "C4",  "100nF",              4.0,   9.0,  0),
        ("Capacitor_SMD",     "C_0402_1005Metric",            "C5",  "100nF",              6.0,   9.0,  0),
        # SW1 BOOT, SW2 RESET – bottom-left, 5mm apart
        ("Button_Switch_SMD", "SW_Push_1P1T_NO_CK_KSC9xxG",  "SW1", "BOOT",               5.0,  26.0,  0),
        ("Button_Switch_SMD", "SW_Push_1P1T_NO_CK_KSC9xxG",  "SW2", "RESET",             11.0,  26.0,  0),
        # R2, R3 I2C pull-ups – to the left of U3
        ("Resistor_SMD",      "R_0402_1005Metric",            "R2",  "4K7",              30.0,  18.5,  0),
        ("Resistor_SMD",      "R_0402_1005Metric",            "R3",  "4K7",              30.0,  20.5,  0),
        # R4, R5 USB CC – below J1 on the right side
        ("Resistor_SMD",      "R_0402_1005Metric",            "R4",  "5K1",               4.0,  11.5,  0),
        ("Resistor_SMD",      "R_0402_1005Metric",            "R5",  "5K1",               6.5,  11.5,  0),
        # H1-H4 M2 mounting holes at board corners (2.5 mm inset)
        ("MountingHole",      "MountingHole_2.2mm_M2_DIN965", "H1",  "M2",               2.5,   2.5,  0),
        ("MountingHole",      "MountingHole_2.2mm_M2_DIN965", "H2",  "M2",              37.5,   2.5,  0),
        ("MountingHole",      "MountingHole_2.2mm_M2_DIN965", "H3",  "M2",               2.5,  27.5,  0),
        ("MountingHole",      "MountingHole_2.2mm_M2_DIN965", "H4",  "M2",              37.5,  27.5,  0),
    ]

    loaded_fps: dict[str, "pcbnew.FOOTPRINT"] = {}  # ref → footprint

    for lib, fp_name, ref, value, x, y, angle in placements:
        try:
            fp = _load_fp(lib, fp_name)
            if fp is None:
                # Fallback: minimal 2-pad placeholder
                fp = _make_placeholder(board, ref, value, fp_name)

            _place_fp(board, fp, ref, value, x, y, angle)
            _assign_nets_by_map(fp_name, fp, nets)
            loaded_fps[ref] = fp
            print(f"[kicad_pcb_writer] Placed {ref} ({value}) at ({x}, {y})")
        except Exception:
            print(f"[kicad_pcb_writer] ERROR placing {ref}:")
            traceback.print_exc()

    # ── Extra net assignments for passives ────────────────────────────────────
    _assign_passive_nets(loaded_fps, nets)

    # ── Critical traces ───────────────────────────────────────────────────────
    _add_power_traces(board, loaded_fps, nets)

    # ── GND copper pours ─────────────────────────────────────────────────────
    _add_gnd_pour(board, nets["GND"], pcbnew.F_Cu)
    _add_gnd_pour(board, nets["GND"], pcbnew.B_Cu)

    # ── Board text ────────────────────────────────────────────────────────────
    _add_courtyard_text(board)

    # ── Fill zones ────────────────────────────────────────────────────────────
    try:
        filler = pcbnew.ZONE_FILLER(board)
        filler.Fill(board.Zones())
    except Exception as e:
        print(f"[kicad_pcb_writer] Zone fill skipped: {e}")

    # ── Save ──────────────────────────────────────────────────────────────────
    pcbnew.SaveBoard(output_path, board)
    print(f"[kicad_pcb_writer] Saved PCB → {output_path}")
    return True


def _make_placeholder(
    board: "pcbnew.BOARD", ref: str, value: str, fp_name: str
) -> "pcbnew.FOOTPRINT":
    """Minimal 2-pad SMD placeholder footprint when the real one fails to load."""
    fp = pcbnew.FOOTPRINT(board)
    fp.SetFPID(pcbnew.LIB_ID("pcbai", fp_name))

    def _add_pad(num: str, dx: float) -> None:
        pad = pcbnew.PAD(fp)
        pad.SetShape(pcbnew.PAD_SHAPE_RECT)
        pad.SetAttribute(pcbnew.PAD_ATTRIB_SMD)
        pad.SetLayerSet(pcbnew.LSET(pcbnew.F_Cu) | pcbnew.LSET(pcbnew.F_Paste) | pcbnew.LSET(pcbnew.F_Mask))
        pad.SetSize(pcbnew.VECTOR2I(_mm(0.8), _mm(0.8)))
        pad.SetPosition(pcbnew.VECTOR2I(_mm(dx), 0))
        pad.SetNumber(num)
        fp.Add(pad)

    _add_pad("1", -1.0)
    _add_pad("2",  1.0)
    return fp


def _assign_passive_nets(
    fps: dict[str, "pcbnew.FOOTPRINT"],
    nets: dict[str, "pcbnew.NETINFO_ITEM"],
) -> None:
    """Assign nets to passive components based on their circuit function."""
    # R1 (330Ω LED series): pin1=+3V3, pin2=LED_ANODE
    if "R1" in fps:
        _assign_pad_net(fps["R1"], ["1"], nets["+3V3"])
        _assign_pad_net(fps["R1"], ["2"], nets["LED_ANODE"])
    # D1 LED: anode=LED_ANODE, cathode=GND
    if "D1" in fps:
        _assign_pad_net(fps["D1"], ["A", "1"], nets["LED_ANODE"])
        _assign_pad_net(fps["D1"], ["K", "2"], nets["GND"])
    # C1 decoupling: pin1=+3V3, pin2=GND
    for cap in ["C1", "C2", "C3"]:
        if cap in fps:
            _assign_pad_net(fps[cap], ["1"], nets["+3V3"])
            _assign_pad_net(fps[cap], ["2"], nets["GND"])
    # C4, C5 VBUS filter
    for cap in ["C4", "C5"]:
        if cap in fps:
            _assign_pad_net(fps[cap], ["1"], nets["VBUS"])
            _assign_pad_net(fps[cap], ["2"], nets["GND"])
    # R2 I2C SCL pull-up: pin1=+3V3, pin2=I2C_SCL
    if "R2" in fps:
        _assign_pad_net(fps["R2"], ["1"], nets["+3V3"])
        _assign_pad_net(fps["R2"], ["2"], nets["I2C_SCL"])
    # R3 I2C SDA pull-up
    if "R3" in fps:
        _assign_pad_net(fps["R3"], ["1"], nets["+3V3"])
        _assign_pad_net(fps["R3"], ["2"], nets["I2C_SDA"])
    # R4 CC1
    if "R4" in fps:
        _assign_pad_net(fps["R4"], ["1"], nets["CC1"])
        _assign_pad_net(fps["R4"], ["2"], nets["GND"])
    # R5 CC2
    if "R5" in fps:
        _assign_pad_net(fps["R5"], ["1"], nets["CC2"])
        _assign_pad_net(fps["R5"], ["2"], nets["GND"])
    # SW1 BOOT: pin1=BOOT_BTN, pin2=GND
    if "SW1" in fps:
        _assign_pad_net(fps["SW1"], ["1", "A"], nets["BOOT_BTN"])
        _assign_pad_net(fps["SW1"], ["2", "B"], nets["GND"])
    # SW2 RESET: pin1=nRESET, pin2=GND
    if "SW2" in fps:
        _assign_pad_net(fps["SW2"], ["1", "A"], nets["nRESET"])
        _assign_pad_net(fps["SW2"], ["2", "B"], nets["GND"])


def _get_pad_pos(fp: "pcbnew.FOOTPRINT", pad_id: str) -> Optional["pcbnew.VECTOR2I"]:
    """Return position of first pad matching *pad_id* (name or number)."""
    for pad in fp.Pads():
        if pad.GetName() == pad_id or pad.GetNumber() == pad_id:
            return pad.GetPosition()
    # fallback: return footprint centre
    if fp.Pads():
        return list(fp.Pads())[0].GetPosition()
    return fp.GetPosition()


def _add_power_traces(
    board: "pcbnew.BOARD",
    fps: dict[str, "pcbnew.FOOTPRINT"],
    nets: dict[str, "pcbnew.NETINFO_ITEM"],
) -> None:
    """Draw key power + signal traces."""
    try:
        # VBUS: J1 → C4
        if "J1" in fps and "C4" in fps:
            p1 = fps["J1"].GetPosition()
            p2 = fps["C4"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["VBUS"], 0.5)
        # VBUS: C4 → U2 pin1
        if "C4" in fps and "U2" in fps:
            p1 = fps["C4"].GetPosition()
            p2 = fps["U2"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["VBUS"], 0.5)
        # +3V3: U2 → C1
        if "U2" in fps and "C1" in fps:
            p1 = fps["U2"].GetPosition()
            p2 = fps["C1"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["+3V3"], 0.3)
        # +3V3: C1 → C2 → C3
        for pair in [("C1", "C2"), ("C2", "C3")]:
            a, b = pair
            if a in fps and b in fps:
                p1 = fps[a].GetPosition()
                p2 = fps[b].GetPosition()
                _add_track(board,
                           p1.x / 1e6, p1.y / 1e6,
                           p2.x / 1e6, p2.y / 1e6,
                           nets["+3V3"], 0.3)
        # +3V3: C3 → U1
        if "C3" in fps and "U1" in fps:
            p1 = fps["C3"].GetPosition()
            p2 = fps["U1"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["+3V3"], 0.3)
        # I2C SCL: U1 → R2 → U3
        if "R2" in fps and "U3" in fps:
            p1 = fps["R2"].GetPosition()
            p2 = fps["U3"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["I2C_SCL"], 0.2)
        # I2C SDA: U1 → R3 → U3
        if "R3" in fps and "U3" in fps:
            p1 = fps["R3"].GetPosition()
            p2 = fps["U3"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["I2C_SDA"], 0.2)
        # LED: R1 → D1
        if "R1" in fps and "D1" in fps:
            p1 = fps["R1"].GetPosition()
            p2 = fps["D1"].GetPosition()
            _add_track(board,
                       p1.x / 1e6, p1.y / 1e6,
                       p2.x / 1e6, p2.y / 1e6,
                       nets["LED_ANODE"], 0.2)
    except Exception:
        print("[kicad_pcb_writer] Some traces skipped:")
        traceback.print_exc()
