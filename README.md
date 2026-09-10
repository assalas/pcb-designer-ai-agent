# PCB Designer AI Agent

An open-source agentic pipeline that turns a natural-language hardware description into a manufacturable PCB. The system automates:

1. Requirement → Component selection (BOM)
2. Datasheet retrieval → Package extraction → Footprint generation (`.kicad_mod`)
3. Schematic synthesis (netlist) via SKiDL with reference circuits
4. PCB placement and routing via KiCad 10 `pcbnew` Python API
5. Gerber generation via `kicad-cli`

**Status:** working scaffold with KiCad 10 integration, parametric footprint generators for all common packages, datasheet PDF extraction, and a full test suite (26 tests, all passing against KiCad 10.0.6).

## Why

- Speed up concept-to-board by automating tedious steps.
- Keep humans in the loop for safety while leveraging LLMs/CV for datasheet understanding.
- Vendor-neutral core with adapters for popular EDA tools.

## Architecture

```
requirements_parser → bom_generator → datasheet_fetcher
    → footprint_generator → skidl_schematic → pcb_router → gerber_exporter
```

- **Core:** config + structured logging
- **LLM providers:** OpenAI / Ollama (pluggable)
- **KiCad backend:** first-class, tested against KiCad 10.0.6
- **Adapters for Altium / Cadence Allegro:** planned

## Project Structure

```text
pcb-designer-ai-agent/
├─ README.md
├─ LICENSE
├─ pyproject.toml
├─ src/pcbai/
│  ├─ core/
│  │  ├─ config.py
│  │  └─ logger.py
│  ├─ llm/
│  │  └─ provider.py
│  ├─ steps/
│  │  ├─ requirements_parser.py
│  │  ├─ bom_generator.py          ← Octopart API + local catalog fallback
│  │  ├─ datasheet_fetcher.py
│  │  ├─ datasheet_package_extractor.py  ← PDF → package dims (OCR + LLM Vision)
│  │  ├─ footprint_generator.py    ← SMD R/C and SOIC
│  │  ├─ footprint_bga.py          ← BGA (JEDEC row letters)
│  │  ├─ footprint_dip.py          ← DIP / THT
│  │  ├─ footprint_qfn_qfp.py      ← QFN + QFP (4-sided, optional EP)
│  │  ├─ footprint_usbc.py         ← USB-C 24-pin receptacle
│  │  ├─ footprint_header.py       ← Pin headers (THT)
│  │  ├─ footprint_custom.py       ← Arbitrary pad layouts from JSON
│  │  ├─ skidl_schematic.py        ← SKiDL netlist + reference circuits
│  │  ├─ pcb_router.py             ← KiCad 10 pcbnew integration
│  │  └─ gerber_exporter.py
│  └─ pipeline/
│     └─ cli.py                    ← Click CLI entrypoint
└─ tests/
   ├─ test_bga.py
   ├─ test_dip.py
   ├─ test_datasheet_extractor.py
   └─ test_updated_modules.py      ← pcb_router, BOM, SKiDL, footprints
```

## Requirements

- Python 3.10+
- [KiCad 10](https://www.kicad.org/download/) — required for `pcb_router` (`pcbnew` Python API must be importable)

Check KiCad is available:

```bash
kicad-cli --version
python3 -c "import pcbnew; print(pcbnew.GetBuildVersion())"
```

On Ubuntu/Debian, `pcbnew.py` is typically at `/usr/lib/python3/dist-packages/pcbnew.py`.

## Install

```bash
pip install -e .
# optional extras:
pip install -e ".[llm]"     # OpenAI / tiktoken
pip install -e ".[vision]"  # pdfminer, pytesseract, Pillow
pip install -e ".[eda]"     # SKiDL
pip install -e ".[test]"    # pytest
```

## Usage

### Generate footprints

**SMD resistor/capacitor (0603):**
```bash
pcbai footprint --type smd_rc --name R_0603 \
  --body-l 1.6 --body-w 0.8 --pad-l 0.9 --pad-w 0.8 --gap 0.8 --out build/
```

**14-pin SOIC:**
```bash
pcbai footprint --type soic --name SOIC-14_3.9x8.7mm_P1.27mm \
  --pins 14 --pitch 1.27 --body-l 8.7 --body-w 3.9 \
  --pad-l 1.5 --pad-w 0.6 --row-offset 2.3 --out build/
```

**32-pin QFN with exposed pad:**
```bash
pcbai footprint --type qfn --name QFN-32_5x5mm_P0.5mm \
  --pins 32 --pitch 0.5 --body-l 5.0 --body-w 5.0 \
  --pad-l 0.75 --pad-w 0.35 --ep-l 3.5 --ep-w 3.5 --out build/
```

**BGA:**
```bash
pcbai footprint --type bga --name BGA-64_8x8 \
  --rows 8 --cols 8 --pitch 1.0 --body-l 10 --body-w 10 --pad-dia 0.5 --out build/
```

**USB-C receptacle:**
```bash
pcbai footprint --type usbc --name USB_C_Receptacle --out build/
```

**Pin header:**
```bash
pcbai footprint --type header --name PinHeader_1x10 \
  --pins 10 --pitch 2.54 --pad-dia 1.6 --drill-dia 0.8 --out build/
```

All output `.kicad_mod` files go into `build/` and can be dropped into any KiCad footprint library.

### Generate a BOM

```bash
pcbai bom "ESP32 WiFi board with buck converter and LiPo charger" --out build/
```

### Extract package from datasheet PDF

```bash
pcbai extract-package path/to/datasheet.pdf --out build/package_guess.json
```

### End-to-end synthesis

```bash
pcbai synthesize "STM32 microcontroller with 3.3V buck and USB-C" --out build/
```

Produces `build/netlist.txt` (SKiDL netlist), then use `pcb_router` to generate `board.kicad_pcb`.

## PCB Router (KiCad 10)

`pcb_router.route_pcb()` generates a Python script that uses the `pcbnew` API to:

1. Create a new `BOARD`
2. Register nets from the netlist via `NETINFO_ITEM` + `board.Add()`
3. Place footprints in a grid
4. Save a valid `.kicad_pcb` file
5. Attempt DSN export for Freerouting

```python
from pcbai.steps.pcb_router import route_pcb

result = route_pcb(
    netlist={"nets": [{"name": "VCC"}, {"name": "GND"}], "components": [...]},
    output_dir="build/"
)
print(result["status"])   # "routed"
print(result["board_file"])  # build/board.kicad_pcb
```

## Configuration

Runtime config via environment variables or YAML — see `src/pcbai/core/config.py`.

| Variable | Purpose |
|---|---|
| `OCTOPART_API_KEY` | Live BOM lookup via Octopart GraphQL API |
| `OPENAI_API_KEY` | LLM-Vision datasheet extraction |

## Running Tests

```bash
pip install -e ".[test]"
pytest tests/ -v
```

All 26 tests pass against KiCad 10.0.6. Tests that exercise `pcb_router` mock `subprocess.run` by default; to run against a live KiCad installation, ensure `pcbnew` is importable.

## Contributing

PRs welcome. Priority areas:

- Datasheet parsers and CV feature extractors
- Additional package generators (TO-220, SOT-23, etc.)
- SKiDL schematic reference circuit templates
- Freerouting DSN/SES integration
- EDA tool adapters (Altium, Cadence Allegro)

## License

Dual-licensed:
- Non-commercial, open-source use granted under the Custom License in `LICENSE`.
- Commercial/enterprise use requires prior written authorisation from the author. Contact: assalas@tutamail.com.
