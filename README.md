# PCB Designer AI Agent

An open-source agentic pipeline that turns a natural-language hardware description into a manufacturable PCB. The system automates:

1) Requirement → Component selection (BOM)
2) Datasheet retrieval → Footprint extraction → Footprint generation (.kicad_mod)
3) Schematic synthesis (netlist) from component reference designs and constraints
4) PCB placement and routing (via KiCad + Freerouting or vendor tools adapters)
5) Gerber generation via EDA tool backends (KiCad first-class; adapters for Altium/Cadence planned)

Status: early scaffold. Includes a working, parametric KiCad footprint generator for common packages and an extensible pipeline with clear interfaces for each step.

## Why
- Speed up concept-to-board by automating tedious steps.
- Keep humans-in-the-loop for safety while leveraging LLMs/CV for datasheet understanding.
- Vendor-neutral core with adapters for popular EDA tools.

## Architecture
- Core config + logging
- Pluggable LLM providers (OpenAI/Ollama/etc.)
- Steps:
  - requirements_parser → bom_generator → datasheet_fetcher → footprint_generator → schematic_synthesizer → pcb_router → gerber_exporter
- Backends:
  - KiCad backend (first-class, CLI-friendly)
  - Adapters for Altium (COM/Script/PDN) and Cadence Allegro (SKILL/CLI) planned

```text
pcb-designer-ai-agent/
├─ README.md
├─ LICENSE
├─ pyproject.toml
├─ .gitignore
├─ src/pcbai/
│  ├─ __init__.py
│  ├─ core/
│  │  ├─ config.py
│  │  └─ logger.py
│  ├─ llm/
│  │  ├─ provider.py
│  │  └─ providers/
│  ├─ steps/
│  │  ├─ requirements_parser.py
│  │  ├─ bom_generator.py
│  │  ├─ datasheet_fetcher.py
│  │  ├─ footprint_generator.py   <-- working generator for SMD R/C and SOIC
│  │  ├─ schematic_synthesizer.py
│  │  ├─ pcb_router.py
│  │  └─ gerber_exporter.py
│  └─ pipeline/
│     └─ cli.py
└─ tests/
   └─ test_footprint_generator.py
```

## Quickstart
- Python 3.10+
- KiCad 7/8 recommended for future steps (not required to try the footprint generator)

Install:

```bash
pip install -e .
```

Generate a 0603 resistor footprint:

```bash
pcbai footprint --type smd_rc --name R_0603 --body-l 1.6 --body-w 0.8 --pad-l 0.9 --pad-w 0.8 --gap 0.8 --out build/
```

Generate a 14-pin SOIC footprint:

```bash
pcbai footprint --type soic --name SOIC-14_3.9x8.7mm_P1.27mm \
  --pins 14 --pitch 1.27 --body-l 8.7 --body-w 3.9 --pad-l 1.5 --pad-w 0.6 --row-offset 2.3 --out build/
```

You will find `.kicad_mod` files in `build/` to drop into a KiCad library.

## Vision + Datasheet extraction
- Planned: PDF/image → text/structured extraction using OCR + LLM-Vision to infer package params when IPC tables are present.
- Today: you can provide measured params directly to the generator.

## Schematic/Netlist synthesis
- Planned: SKiDL-based netlist generation from component set + reference circuits.

## PCB routing and Gerbers
- Planned: KiCad pcbnew and Freerouting integration; `kicad-cli` for Gerbers.
- Adapters for Altium/Cadence will require respective licensed tool installations and API keys.

## Configuration
- All runtime config via environment variables or a YAML file, see `src/pcbai/core/config.py`.

## Contributing
- PRs welcome. Focus areas:
  - Datasheet parsers and CV feature extractors
  - More package generators (QFN/QFP/BGA)
  - SKiDL schematic templates
  - EDA tool adapters

## License
Dual-licensed: 
- Non-commercial, open-source use granted under the Custom License in LICENSE.
- Commercial/enterprise use requires prior written authorization from the author. Contact: set your email in LICENSE.
