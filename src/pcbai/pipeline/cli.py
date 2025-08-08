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


@main.command()
@click.option("--type", "ftype", type=click.Choice(["smd_rc", "soic", "qfn", "qfp"]), required=True)
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
def footprint(ftype: str, name: str, outdir: str, pins: int, pitch: float, body_l: float, body_w: float, pad_l: float, pad_w: float, gap: float, row_offset: float, ep_l: float, ep_w: float, gullwing_ext: float):
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
        from pcbai.steps.footprint_qfn_qfp import QfnParams, generate_qfn, KiCadModuleWriter
        params = QfnParams(name=name, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, ep_l=ep_l, ep_w=ep_w)
        content = generate_qfn(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    elif ftype == "qfp":
        assert all(v is not None for v in [pins, pitch, body_l, body_w, pad_l, pad_w]), "Missing QFP params"
        from pcbai.steps.footprint_qfn_qfp import QfpParams, generate_qfp, KiCadModuleWriter
        params = QfpParams(name=name, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, gullwing_ext=gullwing_ext or 0.0)
        content = generate_qfp(params)
        path = KiCadModuleWriter(outdir).write(name, content)
    else:
        raise click.ClickException("Unsupported type")
    click.echo(f"Wrote {path}")


@main.command()
@click.argument("pdf", type=click.Path(exists=True))
@click.option("--out", "out_json", type=click.Path(), default="build/package_guess.json")
def extract_package(pdf: str, out_json: str):
    """Extract package parameters from a datasheet PDF (heuristic)."""
    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf, save_guess_json
    guess = extract_package_params_from_pdf(pdf)
    from pcbai.steps.datasheet_package_extractor import save_guess_json
    save_guess_json(guess, out_json)
    click.echo(f"Saved package guess to {out_json}")


@main.command()
@click.option("--out", "outdir", type=click.Path(), default="build")
@click.argument("description", nargs=-1)
def synthesize(description: str, outdir: str):
    """Run a minimal end-to-end synthesis: parse → BOM → SKiDL netlist → (placeholder GERBER export)."""
    os.makedirs(outdir, exist_ok=True)
    req = parse_requirements(" ".join(description))
    bom = generate_bom(req)
    netlist = bom_to_schematic(bom)
    netlist_path = os.path.join(outdir, "netlist.txt")
    with open(netlist_path, "w") as f:
        f.write(netlist)
    click.echo(f"Netlist written to {netlist_path}")


if __name__ == "__main__":
    main()
