from __future__ import annotations

from typing import List, Dict


# Placeholder catalog for demo purposes
CATALOG = {
    "mcu": [
        {"mpn": "STM32F103C8T6", "package": "LQFP-48", "voltage": "2.0-3.6V"},
        {"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"},
    ],
    "buck": [
        {"mpn": "MP1584EN", "package": "SOIC-8", "voltage": "4.5-28V"},
    ],
    "lipo": [
        {"mpn": "TP4056", "package": "SOP-8", "voltage": "4.2V charger"},
    ],
}


def generate_bom(requirements: Dict) -> List[Dict]:
    keywords = requirements.get("keywords", [])
    bom: List[Dict] = []
    for kw in keywords:
        parts = CATALOG.get(kw, [])
        bom.extend(parts[:1])  # pick first as placeholder
    return bom
