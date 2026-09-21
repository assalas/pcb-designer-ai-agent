from __future__ import annotations
from typing import List, Dict
import os
import requests

CATALOG = {
    "mcu": [
        {"mpn": "STM32F103C8T6", "package": "LQFP-48", "voltage": "2.0-3.6V"},
        {"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"},
    ],
    "buck": [
        {"mpn": "MP1584EN", "package": "SOIC-8", "voltage": "4.5-28V"},
    ],
    "usb": [
        {"mpn": "USB4105-GF-A", "package": "USB-C-SMD", "voltage": "5V"},
    ],
    "lipo": [
        {"mpn": "TP4056", "package": "SOIC-8", "voltage": "4.2V charger"},
    ],
    "sensor": [
        {"mpn": "MPU6050", "package": "SOIC-8", "voltage": "3.3V"},
    ],
    "sd": [
        {"mpn": "MicroSD-Slot", "package": "SMD", "voltage": "3.3V"},
    ],
    "esp32": [{"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"}],
    "wifi": [
        {"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"},
    ],
    "bluetooth": [
        {"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"},
    ],
    "ldo": [
        {"mpn": "AMS1117-3.3", "package": "SOT-223", "voltage": "3.3V"},
    ]
}

def generate_bom(requirements: Dict) -> List[Dict]:
    keywords = requirements.get("keywords", [])
    bom: List[Dict] = []
    
    for kw in keywords:
        parts = CATALOG.get(kw, [])
        if parts:
            bom.extend(parts[:1])
        else:
            bom.append({"mpn": f"{kw}-UNKNOWN", "package": "UNKNOWN", "voltage": "N/A"})
    return bom
