from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from typing import Dict, Optional, Any

try:
    from pdfminer.high_level import extract_text
except ImportError:  # pragma: no cover
    extract_text = None  # type: ignore

def _extract_text_fallback(pdf_path: str) -> Optional[str]:
    """Fallback text extractor using pypdf if pdfminer is not installed."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text_pages = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(text_pages)
    except ImportError:
        return None


@dataclass
class PackageGuess:
    pkg_type: str  # qfn | qfp | soic | bga | dip | unknown
    pins: Optional[int] = None
    pitch: Optional[float] = None  # mm
    body_l: Optional[float] = None
    body_w: Optional[float] = None
    pad_l: Optional[float] = None
    pad_w: Optional[float] = None
    ep_l: Optional[float] = None  # exposed pad length
    ep_w: Optional[float] = None  # exposed pad width


UNIT_RE = r"(?P<val>\d+(?:\.\d+)?)\s*(?P<unit>mm|mil|in|inch|inches)"
UNIT_RE_UNNAMED = r"(\d+(?:\.\d+)?)\s*(mm|mil|in|inch|inches)"

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

    # Handle unnamed capture groups specifically for UNIT_RE_UNNAMED (val, unit)
    if m.lastindex and m.lastindex >= 2:
        try:
            return _to_mm(float(m.group(1)), m.group(2))
        except Exception:
            pass

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


import os
import base64
import requests
import json
from pcbai.llm.provider import get_provider

def extract_with_llm(text: str) -> Optional[PackageGuess]:
    """Use the configured LLM to extract package parameters from datasheet text."""
    provider = get_provider()
    
    prompt = f"""
You are an expert electronics engineer. Extract the physical package dimensions from the following datasheet text.
The text is from the mechanical drawing section at the end of the datasheet.

Look for a table or text listing dimensions (e.g., body length D, body width E, pitch e, pin width b, exposed pad D2/E2).
Always use millimeters (mm). If the datasheet gives min/nom/max, use the nominal (nom/typ) or average of min/max.

Extract and output ONLY a raw JSON object with these exact keys (use null if not found):
- pkg_type (string, e.g., "qfn", "qfp", "soic", "bga", "dip", "unknown")
- pins (integer, number of pins/pads)
- pitch (float, e.g., 0.5)
- body_l (float, body length)
- body_w (float, body width)
- pad_l (float, pad/terminal length)
- pad_w (float, pad/terminal width)
- ep_l (float, exposed pad length, for QFN)
- ep_w (float, exposed pad width, for QFN)

Datasheet Text:
{text[-12000:]}  # usually at the end of the datasheet
"""
    try:
        content = provider.complete(prompt, max_tokens=300)
            
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            data = json.loads(content[start:end])
            return PackageGuess(
                pkg_type=str(data.get('pkg_type', 'unknown')).lower(),
                pins=int(data.get('pins')) if data.get('pins') is not None else None,
                pitch=float(data.get('pitch')) if data.get('pitch') is not None else None,
                body_l=float(data.get('body_l')) if data.get('body_l') is not None else None,
                body_w=float(data.get('body_w')) if data.get('body_w') is not None else None,
                pad_l=float(data.get('pad_l')) if data.get('pad_l') is not None else None,
                pad_w=float(data.get('pad_w')) if data.get('pad_w') is not None else None,
                ep_l=float(data.get('ep_l')) if data.get('ep_l') is not None else None,
                ep_w=float(data.get('ep_w')) if data.get('ep_w') is not None else None
            )
    except Exception as e:
        print(f"[Extractor] LLM parsing failed: {e}")
    return None

def extract_with_vision(pdf_path: str, provider: str) -> Optional[PackageGuess]:
    """Legacy vision extractor placeholder (replaced by text-based LLM)."""
    return None


def extract_with_ocr(pdf_path: str) -> Optional[str]:
    """Fallback to OCR using pytesseract or camelot if standard text extraction fails."""
    try:
        import pytesseract
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img)
        return text
    except ImportError:
        return None
    except Exception:
        return None


def extract_package_params_from_pdf(pdf_path: str, vision_provider: Optional[str] = None) -> PackageGuess:
    """Heuristic extractor: searches textual datasheets for package tables/notes.

    Returns a best-effort guess for packages. Use human-in-the-loop to confirm.
    """
    if vision_provider:
        vision_guess = extract_with_vision(pdf_path, vision_provider)
        if vision_guess:
            return vision_guess

    text = None
    if extract_text is not None:
        text = extract_text(pdf_path)
    else:
        text = _extract_text_fallback(pdf_path)

    if text is None or not text.strip():
        # Try OCR as fallback
        text = extract_with_ocr(pdf_path)

    if text is None:
        raise ImportError("A PDF parser is required. Run `pip install pypdf`, `pdfminer.six` or configure OCR (`pytesseract`).")

    if not text.strip():
        return PackageGuess(pkg_type="unknown")

    # Try LLM extraction first (most accurate for complex datasheets)
    llm_guess = extract_with_llm(text)
    if llm_guess and llm_guess.pkg_type != "unknown" and (llm_guess.pitch or llm_guess.pins):
        return llm_guess

    # Fallback to Regex
    t = re.sub(r"\s+", " ", text)

    # Determine package family
    if re.search(r"\bQFN\b|\bVFQFN\b|\bMLF\b", t, re.IGNORECASE):
        pkg = "qfn"
    elif re.search(r"\bQFP\b|\bTQFP\b|\bLQFP\b", t, re.IGNORECASE):
        pkg = "qfp"
    elif re.search(r"\bSOIC\b|\bSOP\b|\bTSSOP\b|\bSSOP\b", t, re.IGNORECASE):
        pkg = "soic"
    elif re.search(r"\bBGA\b|\bFBGA\b|\bTFBGA\b|\bWLCSP\b", t, re.IGNORECASE):
        pkg = "bga"
    elif re.search(r"\bDIP\b|\bPDIP\b|\bCDIP\b", t, re.IGNORECASE):
        pkg = "dip"
    else:
        pkg = "unknown"

    # Pins
    pins = _find_first_int(r"\b(\d+)\s*(?:-pin|pin|pins|ball|balls|leads|lead)\b", t)

    # Pitch
    pitch = _find_first_float(r"pitch\s*[:=]?\s*" + UNIT_RE, t)
    if pitch is None:
        pitch = _find_first_float(r"lead pitch\s*[:=]?\s*" + UNIT_RE, t)
    if pitch is None:
        pitch = _find_first_float(UNIT_RE_UNNAMED + r"\s*(?:lead\s+)?pitch", t)

    # Body size
    body_l = _find_first_float(r"body (?:length|L)\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"package length\s*[:=]?\s*" + UNIT_RE, t)
    body_w = _find_first_float(r"body (?:width|W)\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"package width\s*[:=]?\s*" + UNIT_RE, t)

    # Pad (terminal) length/width
    pad_l = _find_first_float(r"terminal length\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"lead length\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"ball diameter\s*(?:is\s*)?[:=]?\s*" + UNIT_RE, t)
    pad_w = _find_first_float(r"terminal width\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"lead width\s*[:=]?\s*" + UNIT_RE, t) or _find_first_float(r"ball diameter\s*(?:is\s*)?[:=]?\s*" + UNIT_RE, t)

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
