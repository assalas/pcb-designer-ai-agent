from __future__ import annotations

import json
from typing import Dict

from pcbai.llm.provider import get_provider


SYSTEM_PROMPT = """\
You are a hardware engineering assistant. Extract structured component requirements from a natural language description.
Return ONLY a valid JSON object with this schema:
{
  "keywords": ["list", "of", "component", "types"],
  "voltage": "string or null",
  "current": "string or null",
  "connectivity": ["wifi", "bluetooth", etc.],
  "mcu": "preferred MCU family or null",
  "notes": "any extra constraints"
}

Component keyword examples: mcu, buck, lipo, usb, wifi, bluetooth, adc, opamp, led, relay, sensor, motor, display.
"""


def parse_requirements(natural_text: str) -> Dict:
    """Use LLM to extract structured requirements from a natural language description.

    Falls back to keyword matching if the LLM is unavailable.
    """
    try:
        provider = get_provider()
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": natural_text},
        ]
        raw = provider.chat(messages, temperature=0.1, max_tokens=300)

        # Extract JSON from response (handle markdown code fences)
        raw = raw.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        result.setdefault("notes", natural_text.strip())
        return result

    except Exception as e:
        # Fallback: simple keyword match
        print(f"[requirements_parser] LLM unavailable ({e}), using keyword fallback.")
        lower = natural_text.lower()
        # Keyword → catalog key mapping for compound terms
        KEYWORD_MAP = {
            "bluetooth": "bluetooth",
            "wifi": "wifi",
            "wi-fi": "wifi",
            "usb-c": "usb",
            "usb": "usb",
            "buck": "buck",
            "lipo": "lipo",
            "lithium": "lipo",
            "battery charger": "lipo",
            "charger": "lipo",
            "mcu": "mcu",
            "microcontroller": "mcu",
            "sd card": "sd",
            "sd": "sd",
            "ldo": "ldo",
            "regulator": "ldo",
            "esp32": "esp32",
            "esp8266": "wifi",
            "stm32": "mcu",
            "arduino": "mcu",
            "rp2040": "mcu",
            "nrf52": "bluetooth",
            "imu": "sensor",
            "accelerometer": "sensor",
            "gyroscope": "sensor",
            "temperature": "sensor",
            "sensor": "sensor",
            "adc": "adc",
            "opamp": "opamp",
            "led": "led",
            "relay": "relay",
            "motor": "motor",
            "display": "display",
            "oled": "display",
            "lcd": "display",
            "i2c": "sensor",
            "spi": "sensor",
            "can bus": "mcu",
            "ethernet": "wifi",
        }
        seen = set()
        keywords = []
        for term, catalog_key in KEYWORD_MAP.items():
            if term in lower and catalog_key not in seen:
                keywords.append(catalog_key)
                seen.add(catalog_key)
        return {"keywords": keywords, "notes": natural_text.strip()}
