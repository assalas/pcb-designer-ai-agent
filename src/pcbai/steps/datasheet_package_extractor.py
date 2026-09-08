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


def extract_package_params_from_pdf_vision(pdf_path: str, provider: Any, model: str = "llava") -> PackageGuess:
    """Uses LLM Vision (e.g. Ollama llava) to extract footprint params from PDF pages.
    Requires pymupdf to be installed.
    """
    try:
        import pymupdf
    except ImportError:
        raise ImportError("pymupdf is required for vision extraction. Run `pip install pymupdf`")

    import base64

    doc = pymupdf.open(pdf_path)
    # We only process the first few and last few pages to save context, as packaging is usually at the end.
    # For a robust solution, you might do an index search, but we will grab up to 4 pages total.
    total = len(doc)
    pages_to_extract = []
    if total <= 4:
        pages_to_extract = list(range(total))
    else:
        pages_to_extract = [0, 1, total - 2, total - 1]

    images_b64 = []
    for p_num in pages_to_extract:
        page = doc[p_num]
        pix = page.get_pixmap(dpi=150) # Keep DPI reasonable to avoid huge payloads
        png_data = pix.tobytes("png")
        b64_str = base64.b64encode(png_data).decode("utf-8")
        images_b64.append(b64_str)

    prompt = (
        "You are an expert electronics engineer. Review the provided datasheet pages (which include packaging info). "
        "Extract the footprint parameters and reply ONLY with a valid JSON object matching this schema. Do not include markdown code blocks or explanations.\n"
        "{\n"
        '  "pkg_type": "string (one of: qfn, qfp, soic, bga, dip, unknown)",\n'
        '  "pins": "integer (number of pins, e.g. 14)",\n'
        '  "pitch": "float (in mm, e.g. 1.27)",\n'
        '  "body_l": "float (in mm)",\n'
        '  "body_w": "float (in mm)",\n'
        '  "pad_l": "float (in mm, terminal length or ball diameter)",\n'
        '  "pad_w": "float (in mm, terminal width or ball diameter)",\n'
        '  "ep_l": "float (in mm, exposed pad length, optional)",\n'
        '  "ep_w": "float (in mm, exposed pad width, optional)"\n'
        "}\n"
    )

    response_text = provider.complete(prompt=prompt, images=images_b64, model=model)

    # Try to parse JSON from the response. Strip out markdown blocks if the LLM ignored instructions.
    clean_text = response_text.strip()
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    if clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]

    try:
        data = json.loads(clean_text)
        return PackageGuess(
            pkg_type=data.get("pkg_type", "unknown"),
            pins=data.get("pins"),
            pitch=data.get("pitch"),
            body_l=data.get("body_l"),
            body_w=data.get("body_w"),
            pad_l=data.get("pad_l"),
            pad_w=data.get("pad_w"),
            ep_l=data.get("ep_l"),
            ep_w=data.get("ep_w")
        )
    except json.JSONDecodeError:
        print(f"Failed to parse JSON from LLM response:\n{response_text}")
        return PackageGuess(pkg_type="unknown")


def extract_package_params_from_pdf(pdf_path: str) -> PackageGuess:
    """Heuristic extractor: searches textual datasheets for package tables/notes.

    Returns a best-effort guess for QFN/QFP packages. Use human-in-the-loop to confirm.
    """
    if extract_text is not None:
        text = extract_text(pdf_path)
    else:
        text = _extract_text_fallback(pdf_path)

    if text is None:
        raise ImportError("A PDF parser is required. Run `pip install pypdf` or `pip install pdfminer.six`.")

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
