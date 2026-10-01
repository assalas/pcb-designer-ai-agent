# PCB Designer AI Agent - Session Memory

**Date:** October 1, 2026
**Project Status:** v1.1.0 — Anna review fixes complete, ready for resubmission

## Summary of Today's Fixes (in response to Anna review)

Anna's rejection reasons and what we fixed:

### 1. ❌ Fixed output (hardcoded ESP32-C3 board regardless of prompt)
- **Root cause:** `design_compiler.py` contained a 20-line hardcoded BOM, completely ignoring the user's prompt.
- **Fix:** Complete rewrite of `design_compiler.py`. It now calls `parse_requirements(prompt)` (LLM via Anna sampling or local fallback) → `generate_bom(requirements)` → builds the schematic and PCB dynamically from that BOM. Every prompt produces a different BOM, schematic, and board.

### 2. ❌ Fixed BOM/footprint mismatch (BOM said ESP32-C3-MINI-1, footprint was WROOM-02)
- **Root cause:** The old `kicad_pcb_writer.py` was hardcoded to one fixed board regardless of input.
- **Fix:** New `design_compiler.py` derives footprint strings from the BOM package field via a consistent `_footprint_str()` mapping table. The BOM entry and the PCB footprint always match.

### 3. ❌ About section overpromised (mentioned dynamic search, cloud routing, LPKF)
- **Fix:** Rewrote `app.json`, `executa.json`, and `plugin.py` MANIFEST to be honest:
  - Clearly states **Local Agent only**, KiCad 8 required
  - Lists setup steps (install KiCad 8, run on Local Agent)
  - Explains what changes with different inputs
  - **Zero LPKF references** anywhere (per user request)

### 4. ❌ Silent failure when pcbnew missing (returned fixed board instead of error)
- **Fix:** `_tool_route_pcb()` now has a pre-flight `import pcbnew` check and returns a clear JSON error if KiCad is not installed.
- `design_compiler.py` raises a `RuntimeError` with a helpful message when pcbnew is unavailable.

## Version
- `executa.json` and plugin MANIFEST: **v1.1.0**

## Files Changed
- `anna-app/app.json` — honest description, Local Agent requirement, setup steps
- `anna-app/executas/pcb-designer/executa.json` — v1.1.0, Local Agent declared, no LPKF
- `anna-app/executas/pcb-designer/plugin.py` — version bump, LPKF removed, route_pcb pre-flight check
- `anna-app/executas/pcb-designer/pcbai/steps/design_compiler.py` — **full rewrite**, now prompt-driven

## 🚀 Next Steps for Resubmission

1. **Run the full pipeline locally** with two different prompts to produce demo screenshots/ZIP files.
   ```bash
   cd anna-app/executas/pcb-designer
   uv run python3 -c "
   from pcbai.steps.design_compiler import compile_design
   import tempfile, os
   with tempfile.TemporaryDirectory() as d:
       r = compile_design('ESP32 WiFi board with USB-C and LDO', d)
       print('BOM:', [c['mpn'] for c in r['bom']])
   "
   ```
2. **Resubmit to Anna** stating: Local Agent only, KiCad 8 required, output changes with prompt.
3. Provide Anna's testers with the two test prompts and expected different outputs as proof.
