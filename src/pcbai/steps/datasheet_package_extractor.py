from __future__ import annotations
import re
import json
from typing import Dict, Any, Optional
import pdfplumber

def find_dim_from_table(table: list[list[str]], keyword: str, header: list[str]) -> float | None:
    for row in table[1:]:
        if row and row[0] and keyword.lower() in str(row[0]).lower():
            try:
                mm_index = header.index("mm")
                val_str = row[mm_index]
                if val_str:
                    match = re.search(r'(\d+\.?\d*)', val_str)
                    if match:
                        return float(match.group(1))
            except (ValueError, IndexError):
                continue
    return None

def find_dim_from_text(keyword: str, text: str) -> float | None:
    match = re.search(fr'{keyword[0]}\w*{keyword[-1]}[^\d]*([\d\.]+)[^\d]*([\d\.]+)', text, re.IGNORECASE | re.DOTALL)
    if match:
        try:
            return float(match.group(2))
        except (ValueError, IndexError):
            return None
    return None

def extract_package_params_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Heuristically extracts package parameters from a datasheet PDF.
    """
    guess = {
        "pkg_type": "unknown",
        "pins": None,
        "pitch": None,
        "body_l": None,
        "body_w": None,
        "pad_l": None,
        "pad_w": None,
        "ep_l": None,
        "ep_w": None,
    }

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # First, try to find a clean dimension table
            tables = page.extract_tables()
            for table in tables:
                if not table or not table[0]: continue
                header = [str(h).lower() for h in table[0]]
                if "mm" in header and "inch" in header:
                    guess['body_l'] = guess['body_l'] or find_dim_from_table(table, 'L', header)
                    guess['body_w'] = guess['body_w'] or find_dim_from_table(table, 'W', header)
                    guess['pad_w'] = guess['pad_w'] or find_dim_from_table(table, 'Top Term', header)

            # If table extraction fails, fall back to regex on raw text
            if not guess['body_l']:
                text = page.extract_text(x_tolerance=1, y_tolerance=1)
                cleaned_text = text.replace('..', '.')
                guess['body_l'] = find_dim_from_text('Length', cleaned_text)
                guess['body_w'] = find_dim_from_text('Width', cleaned_text)
                guess['pad_w'] = find_dim_from_text('Top Term', cleaned_text)

    return guess

def save_guess_json(guess: Dict[str, Any], out_path: str):
    with open(out_path, 'w') as f:
        json.dump(guess, f, indent=2)
