from __future__ import annotations

import os
from typing import Dict

from pcbai.core.config import settings


def export_gerbers(board_file: str, outdir: str) -> str:
    os.makedirs(outdir, exist_ok=True)
    # Try kicad-cli if available
    try:
        import subprocess
        subprocess.run([settings.kicad_cli, 'pcb', 'export', 'gerbers', '--output', outdir, board_file], check=True)
        return outdir
    except Exception:
        # Fallback marker if kicad-cli not present
        marker = os.path.join(outdir, "GERBERS_READY.txt")
        with open(marker, "w") as f:
            f.write(f"Gerbers would be exported for: {board_file}\n")
        return marker
