from __future__ import annotations

from typing import List, Dict


# Placeholder catalog for demo purposes
CATALOG = {
    "mcu": [
        {"mpn": "STM32F103C8T6", "package": "LQFP-48", "voltage": "2.0-3.6V"},
        {"mpn": "ESP32-WROOM-32", "package": "Module", "voltage": "3.0-3.6V"},
    ],
    "buck": [
        {"mpn": "MP1584EN", "package": "SOIC-8", "voltage": "4.5-28V"},
    ],
    "lipo": [
        {"mpn": "TP4056", "package": "SOP-8", "voltage": "4.2V charger"},
    ],
}


import os
import requests

def generate_bom(requirements: Dict) -> List[Dict]:
    keywords = requirements.get("keywords", [])
    bom: List[Dict] = []

    octopart_api_key = os.environ.get("OCTOPART_API_KEY")

    for kw in keywords:
        if octopart_api_key:
            try:
                url = f"https://octopart.com/api/v4/endpoint"
                headers = {"token": octopart_api_key}
                query = """
                query Search($q: String!) {
                  search(q: $q, limit: 1) {
                    results {
                      part {
                        mpn
                        manufacturer { name }
                        specs {
                          attribute { name }
                          display_value
                        }
                      }
                    }
                  }
                }
                """
                response = requests.post(url, headers=headers, json={"query": query, "variables": {"q": kw}}, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("data", {}).get("search", {}).get("results", [])
                    if results:
                        part_data = results[0].get("part", {})
                        mpn = part_data.get("mpn", kw.upper())

                        # Attempt to extract package from specs
                        package = "UNKNOWN"
                        for spec in part_data.get("specs", []):
                            if spec.get("attribute", {}).get("name") in ("Case/Package", "Package / Case"):
                                package = spec.get("display_value", "UNKNOWN")
                                break

                        bom.append({"mpn": mpn, "package": package, "voltage": "N/A"})
                        continue
            except Exception as e:
                print(f"Vendor API request failed: {e}")

        # Fallback to catalog
        parts = CATALOG.get(kw, [])
        if parts:
            bom.extend(parts[:1])  # pick first as placeholder
        else:
            bom.append({"mpn": f"{kw}-UNKNOWN", "package": "UNKNOWN", "voltage": "N/A"})
    return bom
