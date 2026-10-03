from __future__ import annotations
import json
import re
from typing import List, Dict, Optional, Any
from pcbai.llm.provider import get_provider

SYSTEM_PROMPT = """\
You are an expert electronics engineer. Given a list of required component types, select real-world, highly available Manufacturer Part Numbers (MPNs) for each.
Return ONLY a valid JSON array of objects. Do not write any thoughts, greetings, or formatting blocks.
Schema:
[
  {
    "description": "brief description",
    "mpn": "Real MPN (e.g. STM32F103C8T6)",
    "package": "Standard package (e.g. LQFP-48)",
    "pins": 48
  }
]
"""

# JSON schema for LM Studio / OpenAI structured output. Constraining decoding
# stops "thinking" models (e.g. gemma-4) from spending the whole token budget
# deliberating and never emitting the JSON array.
BOM_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "bom",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "components": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "mpn": {"type": "string"},
                            "package": {"type": "string"},
                            "pins": {"type": "integer"},
                        },
                        "required": ["description", "mpn", "package", "pins"],
                    },
                }
            },
            "required": ["components"],
        },
    },
}

# Last-resort fallback: known-good parts per common keyword, used only when the
# LLM cannot produce a usable BOM. Keeps the pipeline from emitting an empty board.
FALLBACK_CATALOG: Dict[str, Dict[str, Any]] = {
    "mcu":       {"description": "32-bit ARM Cortex-M4 MCU", "mpn": "STM32F401RET6", "package": "LQFP-64", "pins": 64},
    "esp32":     {"description": "WiFi/BLE SoC module", "mpn": "ESP32-WROOM-32E", "package": "Module-38", "pins": 38},
    "motor":     {"description": "Dual H-bridge brushed DC motor driver", "mpn": "DRV8833PWPR", "package": "HTSSOP-16", "pins": 16},
    "imu":       {"description": "9-axis IMU", "mpn": "ICM-20948", "package": "QFN-24", "pins": 24},
    "sensor":    {"description": "6-axis IMU", "mpn": "MPU-6050", "package": "QFN-24", "pins": 24},
    "display":   {"description": "OLED display connector (I2C, 4-pin)", "mpn": "PinHeader_1x04", "package": "Header-4", "pins": 4},
    "sd":        {"description": "microSD card socket", "mpn": "DM3AT-SF-PEJM5", "package": "microSD-socket", "pins": 9},
    "bluetooth": {"description": "Bluetooth LE module", "mpn": "NRF52832-QFAA", "package": "QFN-48", "pins": 48},
    "wifi":      {"description": "WiFi module", "mpn": "ESP32-WROOM-32E", "package": "Module-38", "pins": 38},
    "adc":       {"description": "12-bit I2C ADC", "mpn": "ADS1015IDGSR", "package": "MSOP-10", "pins": 10},
    "buck":      {"description": "Synchronous buck converter 4.5-17V in", "mpn": "TPS54331DR", "package": "SOIC-8", "pins": 8},
    "ldo":       {"description": "3.3V LDO regulator", "mpn": "AMS1117-3.3", "package": "SOT-223", "pins": 4},
    "lipo":      {"description": "Battery input connector (JST-PH 2-pin)", "mpn": "S2B-PH-K-S", "package": "JST-PH-2", "pins": 2},
    "usb":       {"description": "USB-C receptacle (USB 2.0)", "mpn": "USB4105-GF-A", "package": "USB-C-16", "pins": 16},
    "opamp":     {"description": "Dual rail-to-rail op-amp", "mpn": "MCP6002-I/SN", "package": "SOIC-8", "pins": 8},
    "led":       {"description": "Status LED", "mpn": "LTST-C171KRKT", "package": "0805", "pins": 2},
    "relay":     {"description": "5V signal relay", "mpn": "G5V-1-DC5", "package": "DIP-6", "pins": 6},
}

# Map free-form keywords (e.g. "buck converter", "usb-c") onto catalog keys.
_FALLBACK_ALIASES = [
    ("motor", "motor"), ("imu", "imu"), ("9-axis", "imu"), ("accel", "sensor"),
    ("gyro", "sensor"), ("sensor", "sensor"), ("oled", "display"), ("lcd", "display"),
    ("display", "display"), ("sd", "sd"), ("bluetooth", "bluetooth"), ("ble", "bluetooth"),
    ("wifi", "wifi"), ("esp32", "esp32"), ("adc", "adc"), ("buck", "buck"),
    ("ldo", "ldo"), ("regulator", "ldo"), ("lipo", "lipo"), ("battery", "lipo"),
    ("usb", "usb"), ("opamp", "opamp"), ("led", "led"), ("relay", "relay"),
    ("mcu", "mcu"), ("microcontroller", "mcu"),
]


def _extract_json_list(raw: str) -> Optional[List[Dict]]:
    """Find the last JSON array (or {"...": [...]} object) in *raw* that parses.

    Thinking models often write prose containing brackets before the real answer,
    so a greedy regex is not enough — scan every candidate start position.
    """
    if not raw:
        return None
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
    decoder = json.JSONDecoder()
    found: Optional[List[Dict]] = None
    for m in re.finditer(r"[\[{]", raw):
        try:
            obj, _ = decoder.raw_decode(raw, m.start())
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            obj = next((v for v in obj.values() if isinstance(v, list)), None)
        if isinstance(obj, list) and obj and all(isinstance(i, dict) and "mpn" in i for i in obj):
            found = obj  # keep the last valid one (final answer)
    return found


def _fallback_bom(keywords: List[str]) -> List[Dict]:
    bom, seen = [], set()
    for kw in keywords:
        lower = kw.lower()
        key = next((k for alias, k in _FALLBACK_ALIASES if alias in lower), None)
        if key and key not in seen:
            seen.add(key)
            bom.append(dict(FALLBACK_CATALOG[key]))
    # ESP32 already is the MCU (and the WiFi radio) — don't add a second MCU / WiFi module
    if "esp32" in seen or "wifi" in seen:
        drop = {FALLBACK_CATALOG["mcu"]["mpn"]} if "mcu" in seen else set()
        bom = [c for c in bom if c["mpn"] not in drop]
        mpns, deduped = set(), []
        for c in bom:
            if c["mpn"] not in mpns:
                mpns.add(c["mpn"])
                deduped.append(c)
        bom = deduped
    return bom


def _ask_llm(provider, prompt: str, structured: bool) -> Optional[List[Dict]]:
    kwargs = {"response_format": BOM_RESPONSE_FORMAT} if structured else {}
    raw = provider.chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ], temperature=0.1, max_tokens=8000, **kwargs)
    bom = _extract_json_list(raw)
    if bom is None:
        print(f"[bom_generator] No usable JSON in LLM output "
              f"({'structured' if structured else 'free-form'}). First 300 chars:\n{raw[:300]}")
    return bom


def generate_bom(requirements: Dict) -> List[Dict]:
    keywords = requirements.get("keywords", [])
    if not keywords:
        return []

    prompt = f"Required components: {', '.join(keywords)}"
    bom: Optional[List[Dict]] = None
    try:
        provider = get_provider()
        # 1) Structured output, 2) free-form retry (for providers without json_schema)
        for structured in (True, False):
            try:
                bom = _ask_llm(provider, prompt, structured)
            except Exception as e:
                print(f"[bom_generator] LLM call failed ({'structured' if structured else 'free-form'}): {e}")
                bom = None
            if bom:
                break
    except Exception as e:
        print(f"[bom_generator] LLM provider unavailable: {e}")

    if not bom:
        bom = _fallback_bom(keywords)
        print(f"[bom_generator] ⚠ Using built-in fallback catalog ({len(bom)} parts).")

    # Sanitize: drop malformed entries, coerce pins to int
    clean: List[Dict] = []
    for item in bom:
        if not isinstance(item, dict) or not item.get("mpn"):
            continue
        try:
            item["pins"] = int(item.get("pins") or 2)
        except (TypeError, ValueError):
            item["pins"] = 2
        item.setdefault("package", "custom")
        item.setdefault("description", item["mpn"])
        item["voltage"] = "N/A"
        clean.append(item)
    return clean
