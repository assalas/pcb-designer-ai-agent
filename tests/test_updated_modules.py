"""Tests for the modules updated in jules_session_7334544902943761255(1).zip"""
from __future__ import annotations

import json
import os
import tempfile
from unittest import mock


# ─────────────────────────────────────────────
# pcb_router.py
# ─────────────────────────────────────────────

def test_generate_pcbnew_script_contains_key_api_calls():
    """Generated script should use KiCad 10 API: FootprintLoad, VECTOR2I, NETINFO_ITEM."""
    from pcbai.steps.pcb_router import _generate_pcbnew_script
    script = _generate_pcbnew_script("/tmp/net.xml", "/tmp/board.kicad_pcb", "/tmp/footprints")

    assert "FootprintLoad" in script, "Should use FootprintLoad() to place components"
    assert "VECTOR2I" in script, "Should use VECTOR2I for position"
    assert "FromMM" in script, "Should use pcbnew.FromMM() for unit conversion"
    assert "NETINFO_ITEM" in script, "Should register nets via NETINFO_ITEM"
    assert "board.Add" in script, "Should use board.Add() to register nets/footprints"
    assert "BuildListOfNets" in script, "Should call BuildListOfNets after adding nets"
    assert "ReadNetlist" not in script, "Deprecated ReadNetlist should not be used"


def test_route_pcb_writes_netlist_json():
    """route_pcb should serialize the netlist dict to netlist.xml before running."""
    from pcbai.steps.pcb_router import route_pcb

    netlist = {"nets": [{"name": "VCC", "pins": []}], "components": []}

    with tempfile.TemporaryDirectory() as tmpdir:
        # Patch subprocess so we don't need KiCad installed
        with mock.patch("pcbai.steps.pcb_router.subprocess.run") as mock_run:
            mock_run.return_value = mock.Mock(returncode=0, stderr="")
            result = route_pcb(netlist, output_dir=tmpdir)

        netlist_path = os.path.join(tmpdir, "netlist.xml")
        assert os.path.exists(netlist_path), "netlist.xml should be written to disk"

        with open(netlist_path) as f:
            written = json.load(f)
        assert written == netlist, "netlist.xml content should match input netlist"


def test_route_pcb_returns_status_routed_on_success():
    from pcbai.steps.pcb_router import route_pcb

    with tempfile.TemporaryDirectory() as tmpdir:
        with mock.patch("pcbai.steps.pcb_router.subprocess.run") as mock_run:
            mock_run.return_value = mock.Mock(returncode=0, stderr="")
            result = route_pcb({}, output_dir=tmpdir)

    assert result["status"] == "routed"
    assert "board_file" in result
    assert result["board_file"].endswith("board.kicad_pcb")


def test_route_pcb_returns_failed_status_on_nonzero_exit():
    from pcbai.steps.pcb_router import route_pcb

    with tempfile.TemporaryDirectory() as tmpdir:
        with mock.patch("pcbai.steps.pcb_router.subprocess.run") as mock_run:
            mock_run.return_value = mock.Mock(returncode=1, stderr="pcbnew not found")
            result = route_pcb({}, output_dir=tmpdir)

    assert "failed" in result["status"]
    assert "pcbnew not found" in result["status"]


def test_route_pcb_cleans_up_temp_script():
    """Temp script file should be deleted after run."""
    from pcbai.steps.pcb_router import route_pcb

    created_scripts = []

    original_NamedTemporaryFile = tempfile.NamedTemporaryFile

    def tracking_ntf(**kwargs):
        f = original_NamedTemporaryFile(**kwargs)
        created_scripts.append(f.name)
        return f

    with tempfile.TemporaryDirectory() as tmpdir:
        with mock.patch("pcbai.steps.pcb_router.subprocess.run") as mock_run, \
             mock.patch("pcbai.steps.pcb_router.tempfile.NamedTemporaryFile", side_effect=tracking_ntf):
            mock_run.return_value = mock.Mock(returncode=0, stderr="")
            route_pcb({}, output_dir=tmpdir)

    for path in created_scripts:
        assert not os.path.exists(path), f"Temp script {path} was not cleaned up"


# ─────────────────────────────────────────────
# bom_generator.py
# ─────────────────────────────────────────────

def test_bom_generator_uses_correct_octopart_url():
    """The Octopart endpoint URL should be /graphql not /endpoint."""
    import inspect
    from pcbai.steps import bom_generator
    source = inspect.getsource(bom_generator)
    assert "api/v4/graphql" in source, "Octopart URL should point to /graphql"
    assert "api/v4/endpoint" not in source, "Old placeholder /endpoint URL should be gone"


def test_bom_generator_catalog_fallback():
    """Without OCTOPART_API_KEY, BOM generator falls back to local catalog."""
    from pcbai.steps.bom_generator import generate_bom

    with mock.patch.dict(os.environ, {}, clear=True):
        # Remove key if present
        os.environ.pop("OCTOPART_API_KEY", None)
        result = generate_bom({"keywords": ["mcu"]})

    assert len(result) > 0
    assert result[0]["mpn"] == "STM32F103C8T6"


def test_bom_generator_unknown_keyword_returns_placeholder():
    from pcbai.steps.bom_generator import generate_bom

    with mock.patch.dict(os.environ, {}, clear=True):
        os.environ.pop("OCTOPART_API_KEY", None)
        result = generate_bom({"keywords": ["totally_unknown_part_xyz"]})

    assert len(result) == 1
    assert "UNKNOWN" in result[0]["mpn"] or "UNKNOWN" in result[0]["package"]


def test_bom_generator_empty_keywords():
    from pcbai.steps.bom_generator import generate_bom

    result = generate_bom({"keywords": []})
    assert result == []


# ─────────────────────────────────────────────
# skidl_schematic.py
# ─────────────────────────────────────────────

def test_skidl_returns_not_installed_message_when_skidl_missing():
    """When SKiDL is not installed, bom_to_schematic should return a helpful message."""
    import pcbai.steps.skidl_schematic as mod

    with mock.patch.object(mod, "Part", None):
        result = mod.bom_to_schematic([{"mpn": "STM32", "package": "LQFP-48"}])

    assert "SKiDL not installed" in result


# ─────────────────────────────────────────────
# footprint_usbc.py
# ─────────────────────────────────────────────

def test_usbc_footprint_has_24_signal_pads():
    from pcbai.steps.footprint_usbc import UsbcParams, generate_usbc
    params = UsbcParams(name="USB_C_Test")
    text = generate_usbc(params)

    # 12 A-row + 12 B-row = 24 signal pads
    a_pads = [f'"A{i}"' for i in range(1, 13)]
    b_pads = [f'"B{i}"' for i in range(1, 13)]
    for pad in a_pads + b_pads:
        assert pad in text, f"Missing pad {pad} in USB-C footprint"


def test_usbc_footprint_has_shield_pins():
    from pcbai.steps.footprint_usbc import UsbcParams, generate_usbc
    params = UsbcParams(name="USB_C_Shield")
    text = generate_usbc(params)
    for s in ["S1", "S2", "S3", "S4"]:
        assert f'"{s}"' in text, f"Missing shield pin {s}"


def test_usbc_footprint_has_outline():
    from pcbai.steps.footprint_usbc import UsbcParams, generate_usbc
    text = generate_usbc(UsbcParams(name="USB_C_Outline"))
    assert "fp_line" in text, "Should have silkscreen outline"


# ─────────────────────────────────────────────
# footprint_header.py
# ─────────────────────────────────────────────

def test_header_footprint_pin_count():
    from pcbai.steps.footprint_header import HeaderParams, generate_header
    params = HeaderParams(name="HDR_10", pins=10, pitch=2.54, pad_dia=1.6, drill_dia=0.8)
    text = generate_header(params)
    assert text.count("thru_hole") == 10


def test_header_footprint_pin1_is_rect():
    from pcbai.steps.footprint_header import HeaderParams, generate_header
    params = HeaderParams(name="HDR_6", pins=6, pitch=2.54, pad_dia=1.6, drill_dia=0.8)
    text = generate_header(params)
    assert '(pad "1" thru_hole rect' in text


# ─────────────────────────────────────────────
# footprint_custom.py
# ─────────────────────────────────────────────

def test_custom_footprint_smd_pads():
    from pcbai.steps.footprint_custom import CustomParams, generate_custom
    coords = json.dumps([
        {"id": "1", "x": 0.0, "y": 0.0, "shape": "rect", "w": 1.0, "h": 1.0, "type": "smd"},
        {"id": "2", "x": 2.0, "y": 0.0, "shape": "rect", "w": 1.0, "h": 1.0, "type": "smd"},
    ])
    params = CustomParams(name="MY_CUSTOM", coordinates=coords)
    text = generate_custom(params)
    assert '"1" smd rect' in text
    assert '"2" smd rect' in text
    assert "F.Cu" in text


def test_custom_footprint_thru_hole_pads():
    from pcbai.steps.footprint_custom import CustomParams, generate_custom
    coords = json.dumps([
        {"id": "1", "x": 0.0, "y": 0.0, "shape": "circle", "w": 1.6, "h": 1.6, "type": "thru", "drill": 0.8},
    ])
    params = CustomParams(name="MY_THT", coordinates=coords)
    text = generate_custom(params)
    assert '"1" thru_hole circle' in text
    assert "*.Cu" in text


def test_custom_footprint_invalid_json_doesnt_crash():
    from pcbai.steps.footprint_custom import CustomParams, generate_custom
    params = CustomParams(name="BAD", coordinates="not valid json {{")
    text = generate_custom(params)
    assert "Error parsing coordinates" in text
    assert text.endswith(")\n")
