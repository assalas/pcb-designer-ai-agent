from __future__ import annotations
import json
import re
from typing import List, Dict
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

def generate_bom(requirements: Dict) -> List[Dict]:
    keywords = requirements.get("keywords", [])
    if not keywords:
        return []
    
    prompt = f"Required components: {', '.join(keywords)}"
    try:
        provider = get_provider()
        raw = provider.chat([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ], temperature=0.1, max_tokens=4000)
        
        # Regex to find JSON array or object
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            raw = match.group(0)
        else:
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:-3].strip()
            elif raw.startswith("```"):
                raw = raw[3:-3].strip()
                
        try:
            bom = json.loads(raw)
        except json.JSONDecodeError:
            print(f"[bom_generator] Failed to parse JSON. Raw output:\n{raw}")
            return []
            
        if isinstance(bom, dict):
            # If it wrapped it in an object, extract the first list value
            for v in bom.values():
                if isinstance(v, list):
                    bom = v
                    break
        # Ensure voltage field exists
        for item in bom:
            item["voltage"] = "N/A"
        return bom
    except Exception as e:
        print(f"[bom_generator] LLM BOM failed: {e}. Falling back to empty.")
        return []
