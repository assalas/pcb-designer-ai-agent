# PCB Designer AI Agent - Developer Rules

When working on, testing, or debugging the `pcb-designer-ai-agent` pipeline, always adhere to the following rules:

1. **KiCad Bindings (`pcbnew`) in `uv`:** When executing tests or agent runs via `uv run` (like `test_extreme.py` or `e2e_demo.py`), the isolated virtual environment will lack the system-wide KiCad Python bindings and crash with `ModuleNotFoundError: No module named 'pcbnew'`. You MUST prepend the system path to your command, e.g., `PYTHONPATH=/usr/lib/python3/dist-packages uv run python3 test_script.py`.

2. **Mitigating `pcbnew` Segmentation Faults:** The KiCad `pcbnew` C++ routing engine frequently crashes (segfault 139) when attempting complex operations like `ZONE_FILLER` on AI-generated or imperfect layouts. Always ensure `pcbnew.SaveBoard()` is called iteratively *before* any high-risk operations (e.g., right after footprint placement) so the board geometry and footprints aren't permanently lost if the process dies.

3. **LLM Output Sanitization:** Local models (like `google/gemma-4-12b`) will often hallucinate package types (e.g., returning "SO PowerPAD" instead of a valid enum like "soic") and omit necessary pad dimensions (returning `null`). Always defensively cast or map `pkg_type` strings to valid defaults (like `soic` or `custom`) and sanitize `None` float values for pads to defaults (e.g., 1.0mm) before passing them to the footprint generator.
