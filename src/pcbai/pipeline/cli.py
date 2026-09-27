from __future__ import annotations

import os
import click

from pcbai.core.logger import get_logger
from pcbai.steps.requirements_parser import parse_requirements
from pcbai.steps.bom_generator import generate_bom
from pcbai.steps.datasheet_fetcher import fetch_datasheet
from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf
from pcbai.steps.skidl_schematic import bom_to_schematic
from pcbai.steps.gerber_exporter import export_gerbers
from pcbai.steps.footprint_generator import (
    SmdRcParams, SoicParams, write_kicad_mod_smd_rc, write_kicad_mod_soic,
)
from pcbai.steps.footprint_qfn_qfp import QfnParams, QfpParams, generate_qfn, generate_qfp, KiCadModuleWriter
from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf

logger = get_logger()


@click.group()
def main():
    """PCB AI Agent CLI"""


# ─────────────────────────────────────────────────────────────────────────────
# design  – Full end-to-end pipeline (NEW)
# ─────────────────────────────────────────────────────────────────────────────

@main.command()
@click.argument("description", nargs=-1)
@click.option("--out", "outdir", type=click.Path(), default="build")
def design(description: str, outdir: str):
    """Full end-to-end PCB design: prompt → BOM → schematic → PCB → Gerbers → zip."""
    from pcbai.steps.design_compiler import compile_design
    text = " ".join(description)
    if not text.strip():
        raise click.UsageError("Please provide a design description.")
    click.echo(f"[pcbai] Compiling design: {text[:80]}…")
    result = compile_design(text, outdir)
    click.echo(f"[pcbai] ✅ Design complete!")
    click.echo(f"  BOM        : {len(result['bom'])} components")
    click.echo(f"  Schematic  : {result['sch']}")
    click.echo(f"  PCB        : {result['pcb']}")
    click.echo(f"  Gerbers    : {result['gerbers']}")
    click.echo(f"  ZIP        : {result['zip']}")


# ─────────────────────────────────────────────────────────────────────────────
# bom
# ─────────────────────────────────────────────────────────────────────────────

@main.command()
@click.argument("description", nargs=-1)
@click.option("--out", "outdir", type=click.Path(), default="build")
def bom(description: str, outdir: str):
    """Generate a toy BOM from a natural language description."""
    text = " ".join(description)
    req = parse_requirements(text)
    parts = generate_bom(req)
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, "bom.txt")
    with open(path, "w") as f:
        for p in parts:
            f.write(f"{p['mpn']},{p['package']}\n")
    click.echo(f"BOM written to {path}")


# ─────────────────────────────────────────────────────────────────────────────
# footprint
# ─────────────────────────────────────────────────────────────────────────────

@main.command()
@click.option("--type", "ftype", type=click.Choice([
    "smd_rc", "soic", "qfn", "qfp", "bga", "dip", "usbc", "header", "custom"
]), required=True)
@click.option("--name", required=True)
@click.option("--out", "outdir", type=click.Path(), default="build")
# Common
@click.option("--pins", type=int)
@click.option("--pitch", type=float)
@click.option("--body-l", type=float)
@click.option("--body-w", type=float)
@click.option("--pad-l", type=float)
@click.option("--pad-w", type=float)
# SMD RC
@click.option("--gap", type=float)
# SOIC
@click.option("--row-offset", type=float)
# QFN specific
@click.option("--ep-l", type=float)
@click.option("--ep-w", type=float)
# QFP specific
@click.option("--gullwing-ext", type=float)
# BGA specific
@click.option("--rows", type=int)
@click.option("--cols", type=int)
@click.option("--pad-dia", type=float)
# DIP / THT specific
@click.option("--drill-dia", type=float)
@click.option("--row-spacing", type=float)
# Custom specific
@click.option("--coordinates", type=str)
def footprint(ftype, name, outdir, pins, pitch, body_l, body_w, pad_l, pad_w,
              gap, row_offset, ep_l, ep_w, gullwing_ext, rows, cols, pad_dia,
              drill_dia, row_spacing, coordinates):
    """Generate a KiCad footprint (.kicad_mod)."""
    os.makedirs(outdir, exist_ok=True)
    if ftype == "smd_rc":
        assert all(v is not None for v in [body_l, body_w, pad_l, pad_w, gap]), "Missing SMD RC params"
        params = SmdRcParams(name=name, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, gap=gap)
        path = write_kicad_mod_smd_rc(outdir, params)
    elif ftype == "soic":
        assert all(v is not None for v in [pins, pitch, body_l, body_w, pad_l, pad_w, row_offset]), "Missing SOIC params"
        params = SoicParams(name=name, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, row_offset=row_offset)
        path = write_kicad_mod_soic(outdir, params)
    elif ftype == "qfn":
        assert all(v is not None for v in [pins, pitch, body_l, body_w, pad_l, pad_w]), "Missing QFN params"
        params = QfnParams(name=name, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, ep_l=ep_l, ep_w=ep_w)
        content = generate_qfn(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    elif ftype == "qfp":
        assert all(v is not None for v in [pins, pitch, body_l, body_w, pad_l, pad_w]), "Missing QFP params"
        params = QfpParams(name=name, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, gullwing_ext=gullwing_ext or 0.0)
        content = generate_qfp(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    elif ftype == "bga":
        assert all(v is not None for v in [rows, cols, pitch, body_l, body_w, pad_dia]), "Missing BGA params"
        from pcbai.steps.footprint_bga import BgaParams, generate_bga, KiCadModuleWriter as BW
        params = BgaParams(name=name, rows=rows, cols=cols, pitch=pitch, body_l=body_l, body_w=body_w, pad_dia=pad_dia)
        content = generate_bga(params)
        path = BW(outdir).write(name, content)
    elif ftype == "dip":
        assert all(v is not None for v in [pins, pitch, row_spacing, body_l, body_w, pad_dia, drill_dia]), "Missing DIP params"
        from pcbai.steps.footprint_dip import DipParams, generate_dip, KiCadModuleWriter as DW
        params = DipParams(name=name, pins=pins, pitch=pitch, row_spacing=row_spacing, body_l=body_l, body_w=body_w, pad_dia=pad_dia, drill_dia=drill_dia)
        content = generate_dip(params)
        path = DW(outdir).write(name, content)
    elif ftype == "usbc":
        from pcbai.steps.footprint_usbc import UsbcParams, generate_usbc
        params = UsbcParams(name=name)
        content = generate_usbc(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    elif ftype == "header":
        assert all(v is not None for v in [pins, pitch, pad_dia, drill_dia]), "Missing Header params"
        from pcbai.steps.footprint_header import HeaderParams, generate_header
        params = HeaderParams(name=name, pins=pins, pitch=pitch, pad_dia=pad_dia, drill_dia=drill_dia)
        content = generate_header(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    elif ftype == "custom":
        assert coordinates is not None, "Missing coordinates for custom footprint"
        from pcbai.steps.footprint_custom import CustomParams, generate_custom
        params = CustomParams(name=name, coordinates=coordinates)
        content = generate_custom(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    else:
        raise click.ClickException("Unsupported type")
    click.echo(f"Wrote {path}")


# ─────────────────────────────────────────────────────────────────────────────
# extract_package
# ─────────────────────────────────────────────────────────────────────────────

@main.command()
@click.argument("pdf", type=click.Path(exists=True))
@click.option("--out", "out_json", type=click.Path(), default="build/package_guess.json")
def extract_package(pdf: str, out_json: str):
    """Extract package parameters from a datasheet PDF (heuristic)."""
    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf, save_guess_json
    guess = extract_package_params_from_pdf(pdf)
    save_guess_json(guess, out_json)
    click.echo(f"Saved package guess to {out_json}")


# ─────────────────────────────────────────────────────────────────────────────
# synthesize
# ─────────────────────────────────────────────────────────────────────────────

@main.command()
@click.option("--out", "outdir", type=click.Path(), default="build")
@click.argument("description", nargs=-1)
def synthesize(description: str, outdir: str):
    """Run a minimal end-to-end synthesis: parse → BOM → SKiDL netlist → (placeholder GERBER export)."""
    os.makedirs(outdir, exist_ok=True)
    req = parse_requirements(" ".join(description))
    bom_items = generate_bom(req)
    netlist = bom_to_schematic(bom_items)
    netlist_path = os.path.join(outdir, "netlist.txt")
    with open(netlist_path, "w") as f:
        f.write(netlist)
    click.echo(f"Netlist written to {netlist_path}")


if __name__ == "__main__":
    main()
