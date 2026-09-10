from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import requests


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, prompt: str, **kwargs) -> str: ...

    @abstractmethod
    def chat(self, messages: List[Dict], **kwargs) -> str: ...


# ─────────────────────────────────────────────
# LM Studio  (OpenAI-compatible local server)
# ─────────────────────────────────────────────

class LMStudioProvider(LLMProvider):
    """Talks to LM Studio's local OpenAI-compatible API (default: http://localhost:1234)."""

    def __init__(self, base_url: str = "http://localhost:1234", model: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self._model = model  # None = auto-pick first available model

    def _get_model(self) -> str:
        if self._model:
            return self._model
        r = requests.get(f"{self.base_url}/v1/models", timeout=5)
        r.raise_for_status()
        models = r.json().get("data", [])
        if not models:
            raise RuntimeError("LM Studio: no models loaded. Load a model in the LM Studio UI.")
        return models[0]["id"]

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        model = self._get_model()
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        r = requests.post(f"{self.base_url}/v1/chat/completions",
                          json=payload, timeout=120)
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
        # Thinking models (e.g. qwen3) put output in reasoning_content when content is empty
        content = msg.get("content", "").strip()
        if not content:
            content = msg.get("reasoning_content", "").strip()
        return content

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# OpenAI (real API)
# ─────────────────────────────────────────────

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.environ["OPENAI_API_KEY"]
        self.model = model

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "messages": messages,
                  "temperature": temperature, "max_tokens": max_tokens},
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# Dummy (fallback / testing)
# ─────────────────────────────────────────────

class DummyProvider(LLMProvider):
    def complete(self, prompt: str, **kwargs) -> str:
        return "DummyProvider: configure PCB_AI_LLM_PROVIDER"

    def chat(self, messages: List[Dict], **kwargs) -> str:
        return self.complete(messages[-1].get("content", ""))


# ─────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────

def get_provider() -> LLMProvider:
    """Return the configured LLM provider based on PCB_AI_LLM_PROVIDER env var."""
    name = os.getenv("PCB_AI_LLM_PROVIDER", "lmstudio").lower()
    if name == "lmstudio":
        base_url = os.getenv("LMSTUDIO_URL", "http://localhost:1234")
        model = os.getenv("LMSTUDIO_MODEL")  # None = auto
        return LMStudioProvider(base_url=base_url, model=model)
    if name == "openai":
        return OpenAIProvider()
    return DummyProvider()
