"""LLM-driven netlist generation.

Given an enriched BOM (each entry has ``ref``, ``mpn``, ``package``, ``pins``),
ask the LLM which pins connect to which, using real datasheet pinouts.

Output format::

    {"nets": [{"name": "GND", "pins": [{"ref": "U1", "pin": "8"}, ...]}, ...]}

The result is validated (unknown refs / out-of-range pins dropped, each pin in
at most one net, nets with < 2 pins removed) so downstream PCB code can trust it.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from pcbai.llm.provider import get_provider

SYSTEM_PROMPT = """\
You are an expert electronics engineer creating the netlist (connectivity) for a PCB.
You are given a BOM with reference designators, part numbers, packages and pin counts.
Using the REAL datasheet pinout of each part, connect the parts into a working circuit:
- Power: connect every part's supply pins to the right rail (e.g. "+5V", "+3V3") and every ground pin to "GND".
- Signals: connect the interfaces the design needs (USB D+/D-, SPI, I2C SDA/SCL, UART TX/RX, GPIO to LED, enable pins, etc.).
- Use the physical PAD NUMBER of the package as "pin" (e.g. "1", "14"), never a pin name.
- Every net must connect at least 2 pins. A pin may appear in only one net.
- Only use the reference designators listed in the BOM.
Name nets descriptively (GND, +5V, +3V3, USB_DP, USB_DN, SPI_SCK, I2C_SDA, LED1_K ...).
Return ONLY JSON: {"nets": [{"name": "GND", "pins": [{"ref": "U1", "pin": "8"}]}]}
"""

NETLIST_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "netlist",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "nets": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "pins": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "ref": {"type": "string"},
                                        "pin": {"type": "string"},
                                    },
                                    "required": ["ref", "pin"],
                                },
                            },
                        },
                        "required": ["name", "pins"],
                    },
                }
            },
            "required": ["nets"],
        },
    },
}


def _extract_nets(raw: str) -> Optional[List[Dict[str, Any]]]:
    """Return the last ``{"nets": [...]}`` object found in *raw* (tolerates prose / <think>)."""
    raw = re.sub(r"<think>.*?</think>", "", raw or "", flags=re.DOTALL)
    dec, found = json.JSONDecoder(), None
    for m in re.finditer(r"\{", raw):
        try:
            obj, _ = dec.raw_decode(raw, m.start())
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and isinstance(obj.get("nets"), list):
            found = obj["nets"]
    return found


def _validate(nets: List[Dict[str, Any]], bom: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    pin_counts = {c["ref"]: int(c.get("pins") or 0) for c in bom if c.get("ref")}
    used: set = set()
    clean: List[Dict[str, Any]] = []
    names: set = set()
    for net in nets:
        if not isinstance(net, dict):
            continue
        name = re.sub(r"[^A-Za-z0-9_+\-./]", "_", str(net.get("name") or "").strip())[:40] or f"N{len(clean)+1}"
        base, k = name, 2
        while name in names:            # keep net names unique
            name, k = f"{base}_{k}", k + 1
        pins = []
        for p in net.get("pins") or []:
            if not isinstance(p, dict):
                continue
            ref = str(p.get("ref", "")).strip()
            pin = str(p.get("pin", "")).strip()
            if ref not in pin_counts or not pin:
                continue
            # Numeric pads must be within the part's pin count (when known)
            if pin.isdigit() and pin_counts[ref] and not (1 <= int(pin) <= pin_counts[ref]):
                continue
            if (ref, pin) in used:
                continue
            used.add((ref, pin))
            pins.append({"ref": ref, "pin": pin})
        if len(pins) >= 2:
            names.add(name)
            clean.append({"name": name, "pins": pins})
    return clean


def _fallback_netlist(bom: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Old behaviour: pad 1 → GND, pad 2 → +3V3 on every part."""
    gnd = [{"ref": c["ref"], "pin": "1"} for c in bom if int(c.get("pins") or 0) >= 1]
    vcc = [{"ref": c["ref"], "pin": "2"} for c in bom if int(c.get("pins") or 0) >= 2]
    return [n for n in ({"name": "GND", "pins": gnd}, {"name": "+3V3", "pins": vcc}) if len(n["pins"]) >= 2]


def generate_netlist(bom: List[Dict[str, Any]], prompt: str = "") -> Dict[str, Any]:
    """Return ``{"nets": [...], "source": "llm" | "fallback"}``."""
    if len(bom) < 2:
        return {"nets": [], "source": "fallback"}

    bom_lines = "\n".join(
        f"- {c['ref']}: {c.get('mpn')} ({c.get('package')}, {c.get('pins')} pins) — {c.get('description', '')}"
        for c in bom
    )
    user = f"Design goal: {prompt}\n\nBOM:\n{bom_lines}\n\nProduce the netlist."
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user}]

    try:
        provider = get_provider()
    except Exception as e:
        print(f"[netlist] LLM provider unavailable: {e}")
        provider = None

    if provider is not None:
        # 1) structured output, 2) free-form retry for providers without json_schema
        for structured in (True, False):
            mode = "structured" if structured else "free-form"
            try:
                kwargs = {"response_format": NETLIST_RESPONSE_FORMAT} if structured else {}
                raw = provider.chat(messages, temperature=0.1, max_tokens=8000, **kwargs)
            except Exception as e:
                print(f"[netlist] LLM call failed ({mode}): {e}")
                continue
            nets = _extract_nets(raw)
            if nets is None:
                print(f"[netlist] No JSON netlist in LLM output ({mode}). First 300 chars:\n{raw[:300]}")
                continue
            clean = _validate(nets, bom)
            dropped = len(nets) - len(clean)
            if clean:
                print(f"[netlist] LLM netlist: {len(clean)} nets, "
                      f"{sum(len(n['pins']) for n in clean)} connections"
                      + (f" ({dropped} invalid nets dropped)" if dropped else ""))
                return {"nets": clean, "source": "llm"}
            print(f"[netlist] LLM netlist had no valid nets after validation ({mode}).")

    nets = _fallback_netlist(bom)
    print(f"[netlist] ⚠ Using fallback GND/VCC netlist ({len(nets)} nets).")
    return {"nets": nets, "source": "fallback"}
