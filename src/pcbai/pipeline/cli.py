from __future__ import annotations

import os
import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from pcbai.core.logger import get_logger

console = Console()
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
@click.option("--type", "ftype", type=click.Choice(["smd_rc", "soic", "qfn", "qfp", "bga", "dip"]), required=True)
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
@click.option("--preview/--no-preview", default=True, help="Generate HTML/SVG visual preview alongside the footprint")
def footprint(ftype: str, name: str, outdir: str, pins: int, pitch: float, body_l: float, body_w: float, pad_l: float, pad_w: float, gap: float, row_offset: float, ep_l: float, ep_w: float, gullwing_ext: float, rows: int, cols: int, pad_dia: float, drill_dia: float, row_spacing: float, preview: bool):
    """Generate a KiCad footprint (.kicad_mod) and optionally a visual SVG preview."""
    os.makedirs(outdir, exist_ok=True)
    html_path = None
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
    elif ftype == "bga":
        assert all(v is not None for v in [rows, cols, pitch, body_l, body_w, pad_dia]), "Missing BGA params"
        from pcbai.steps.footprint_bga import BgaParams, generate_bga, generate_bga_svg, KiCadModuleWriter
        params = BgaParams(name=name, rows=rows, cols=cols, pitch=pitch, body_l=body_l, body_w=body_w, pad_dia=pad_dia)
        content = generate_bga(params)
        path = KiCadModuleWriter(outdir).write(name, content)
        if preview:
            html_content = generate_bga_svg(params)
            html_path = os.path.join(outdir, f"{name}_preview.html")
            with open(html_path, "w") as f:
                f.write(html_content)
    elif ftype == "dip":
        assert all(v is not None for v in [pins, pitch, row_spacing, body_l, body_w, pad_dia, drill_dia]), "Missing DIP params"
        from pcbai.steps.footprint_dip import DipParams, generate_dip, generate_dip_svg, KiCadModuleWriter
        params = DipParams(name=name, pins=pins, pitch=pitch, row_spacing=row_spacing, body_l=body_l, body_w=body_w, pad_dia=pad_dia, drill_dia=drill_dia)
        content = generate_dip(params)
        path = KiCadModuleWriter(outdir).write(name, content)
        if preview:
            html_content = generate_dip_svg(params)
            html_path = os.path.join(outdir, f"{name}_preview.html")
            with open(html_path, "w") as f:
                f.write(html_content)
    else:
        raise click.ClickException("Unsupported type")

    table = Table(title="Footprint Generation Success", show_header=False, box=None)
    table.add_row(f"[bold green]KiCad Module:[/bold green]", f"[cyan]{path}[/cyan]")
    if html_path:
        table.add_row(f"[bold green]Visual Preview:[/bold green]", f"[cyan]{html_path}[/cyan]")
    console.print(Panel(table, expand=False, border_style="green"))


@main.command()
@click.argument("pdf", type=click.Path(exists=True))
@click.option("--out", "out_json", type=click.Path(), default="build/package_guess.json")
@click.option("--use-vision", is_flag=True, help="Use LLM vision processing (e.g. Ollama llava) for extraction")
@click.option("--llm-model", default="llava", help="The LLM model to use if --use-vision is set")
def extract_package(pdf: str, out_json: str, use_vision: bool, llm_model: str):
    """Extract package parameters from a datasheet PDF."""
    os.makedirs(os.path.dirname(out_json), exist_ok=True)

    if use_vision:
        from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf_vision
        from pcbai.llm.providers.ollama import OllamaProvider
        provider = OllamaProvider(default_model=llm_model)
        guess = extract_package_params_from_pdf_vision(pdf, provider, model=llm_model)
    else:
        from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf
        guess = extract_package_params_from_pdf(pdf)

    from pcbai.steps.datasheet_package_extractor import save_guess_json
    save_guess_json(guess, out_json)

    table = Table(title="Datasheet Extraction Results", show_header=True, header_style="bold magenta")
    table.add_column("Parameter")
    table.add_column("Value", style="cyan")

    table.add_row("Package Type", str(guess.pkg_type).upper())
    table.add_row("Pins", str(guess.pins))
    table.add_row("Pitch", f"{guess.pitch} mm" if guess.pitch else "None")
    table.add_row("Body (L x W)", f"{guess.body_l} x {guess.body_w} mm" if guess.body_l and guess.body_w else "None")

    console.print(Panel(table, title="[bold green]Success[/bold green]", expand=False))
    console.print(f"📄 Saved raw JSON to: [bold]{out_json}[/bold]")


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
