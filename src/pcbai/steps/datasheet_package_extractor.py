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

def extract_with_vision(pdf_path: str, provider: str) -> Optional[PackageGuess]:
    """Fallback to LLM Vision extraction when an API is available."""
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path)
        if not images:
            return None

        # We'll just look at the first page for the example, or iterate through.
        # Save to temp bytes
        import io
        img_byte_arr = io.BytesIO()
        images[0].save(img_byte_arr, format='PNG')
        base64_image = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

        if provider.lower() == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                return None
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract package dimensions (type, pins, pitch, body_l, body_w, pad_l, pad_w) from this datasheet as JSON."},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                        ]
                    }
                ],
                "max_tokens": 300
            }
            response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                # Crude JSON extraction for demonstration
                import json
                try:
                    start = content.find('{')
                    end = content.rfind('}') + 1
                    data = json.loads(content[start:end])
                    return PackageGuess(
                        pkg_type=data.get('pkg_type', 'unknown'),
                        pins=data.get('pins'),
                        pitch=data.get('pitch'),
                        body_l=data.get('body_l'),
                        body_w=data.get('body_w'),
                        pad_l=data.get('pad_l'),
                        pad_w=data.get('pad_w')
                    )
                except json.JSONDecodeError:
                    return None
    except Exception as e:
        print(f"Vision extraction failed: {e}")
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

    # Normalize
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
