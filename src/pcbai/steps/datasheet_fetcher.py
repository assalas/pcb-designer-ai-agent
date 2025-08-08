from __future__ import annotations

import os
from typing import List, Dict, Optional
import requests


DATASHEET_SOURCES = [
    "https://datasheet.octopart.com/{}",
    "https://www.ti.com/lit/pdf/{}",
    "https://www.analog.com/media/en/technical-documentation/data-sheets/{}",
]


def fetch_datasheet(mpns: List[str], outdir: str) -> List[str]:
    os.makedirs(outdir, exist_ok=True)
    paths: List[str] = []
    for mpn in mpns:
        # This is a stub: try a few URL patterns naively.
        for pattern in DATASHEET_SOURCES:
            url = pattern.format(mpn)
            try:
                r = requests.get(url, timeout=5)
                if r.ok and r.headers.get("content-type", "").startswith("application/pdf"):
                    path = os.path.join(outdir, f"{mpn}.pdf")
                    with open(path, "wb") as f:
                        f.write(r.content)
                    paths.append(path)
                    break
            except Exception:
                continue
    return paths
