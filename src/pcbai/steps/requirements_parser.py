from __future__ import annotations

from typing import List, Dict


def parse_requirements(natural_text: str) -> Dict:
    """Very basic placeholder that extracts target keywords.

    In the future, use an LLM to extract structured requirements.
    """
    lower = natural_text.lower()
    result = {
        "keywords": [w for w in ["bluetooth", "wifi", "usb", "buck", "lipo", "mcu", "adc", "opamp"] if w in lower],
        "notes": natural_text.strip(),
    }
    return result
