from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from typing import Dict, Optional, Any

try:
    from pdfminer.high_level import extract_text
except Exception:  # pragma: no cover
    extract_text = None  # type: ignore


@dataclass
class PackageGuess:
    pkg_type: str  # qfn | qfp | soic | unknown
    pins: Optional[int] = None
    pitch: Optional[float] = None  # mm
    body_l: Optional[float] = None
    body_w: Optional[float] = None
    pad_l: Optional[float] = None
    pad_w: Optional[float] = None
    ep_l: Optional[float] = None  # exposed pad length
    ep_w: Optional[float] = None  # exposed pad width


UNIT_RE = r"(?P<val>\d+(?:\.\d+)?)\s*(?P<unit>mm|mil|in|inch|inches)"


def _to_mm(val: float, unit: str) -> float:
    unit = unit.lower()
    if unit == "mm":
        return val
    if unit == "mil":  # 1 mil = 0.0254 mm
        return val * 0.0254
    if unit in ("in", "inch", "inches"):
        return val * 25.4
    return val


def _find_first_float(pattern: str, text: str) -> Optional[float]:
    m = re.search(pattern, text, flags=re.IGNORECASE)
    if not m:
        return None
    gd = m.groupdict()
    if "val" in gd and "unit" in gd:
        return _to_mm(float(gd["val"]), gd["unit"])  # type: ignore
    if m.group(1):
        try:
            return float(m.group(1))
        except Exception:
            return None
    return None


def _find_first_int(pattern: str, text: str) -> Optional[int]:
    m = re.search(pattern, text, flags=re.IGNORECASE)
    if not m:
        return None
    try:
        return int(m.group(1))
    except Exception:
        return None


def extract_package_params_from_pdf(pdf_path: str) -> PackageGuess:
    """Heuristic extractor: searches textual datasheets for package tables/notes.

    Returns a best-effort guess for QFN/QFP packages. Use human-in-the-loop to confirm.
    """
    if extract_text is None:
        return PackageGuess(pkg_type="unknown")

    text = extract_text(pdf_path)
    if not text:
        return PackageGuess(pkg_type="unknown")

    # Normalize
    t = re.sub(r"\s+", " ", text)

    # Determine package family
    if re.search(r"\bQFN\b|\bVFQFN\b|\bMLF\b", t, re.IGNORECASE):
        pkg = "qfn"
    elif re.search(r"\bQFP\b|\bTQFP\b|\bLQFP\b", t, re.IGNORECASE):
        pkg = "qfp"
    else:
        pkg = "unknown"

    # Pins
    pins = _find_first_int(r"\b(\d{10,3}|\d{2})\s*(?:pins|pin)\b", t)

    # Pitch
    pitch = _find_first_float(r"pitch\s*[:=]?\s*" + UNIT_RE, t)
    if pitch is None:
        pitch = _find_first_float(r"lead pitch\s*[:=]?\s*" + UNIT_RE, t)

    # Body size
    body_l = _find_first_float(r"body (?:length|L)\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"package length\s*[:=]?\s*" + UNIT_RE, t)
    body_w = _find_first_float(r"body (?:width|W)\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"package width\s*[:=]?\s*" + UNIT_RE, t)

    # Pad (terminal) length/width
    pad_l = _find_first_float(r"terminal length\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"lead length\s*[:=]?\s*" + UNIT_RE, t)
    pad_w = _find_first_float(r"terminal width\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"lead width\s*[:=]?\s*" + UNIT_RE, t)

    # Exposed pad for QFN
    ep_l = _find_first_float(r"exposed pad (?:length|L)\s*[:=]?\s*" + UNIT_RE, t)
    ep_w = _find_first_float(r"exposed pad (?:width|W)\s*[:=]?\s*" + UNIT_RE, t)

    return PackageGuess(pkg_type=pkg, pins=pins, pitch=pitch, body_l=body_l, body_w=body_w, pad_l=pad_l, pad_w=pad_w, ep_l=ep_l, ep_w=ep_w)


def save_guess_json(guess: PackageGuess, out_json: str) -> str:
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(asdict(guess), f, indent=2)
    return out_json


def load_guess_json(path: str) -> PackageGuess:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return PackageGuess(**data)
