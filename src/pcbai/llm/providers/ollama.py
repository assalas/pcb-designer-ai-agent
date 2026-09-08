from __future__ import annotations

import json
import requests
from typing import Dict, Any, List

from pcbai.llm.provider import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(self, host: str = "http://localhost:11434", default_model: str = "llava"):
        self.host = host.rstrip("/")
        self.default_model = default_model

    def complete(self, prompt: str, **kwargs) -> str:
        model = kwargs.get("model", self.default_model)
        images = kwargs.get("images", [])  # list of base64 strings

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }
        if images:
            payload["images"] = images

        url = f"{self.host}/api/generate"
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()

        data = response.json()
        return data.get("response", "")
