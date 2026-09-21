from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import json
import requests

def _get_max_tokens(kwargs_tokens: int) -> int:
    env_tokens = os.getenv("PCB_AI_MAX_TOKENS")
    return int(env_tokens) if env_tokens else kwargs_tokens

def _get_temperature(kwargs_temp: float) -> float:
    env_temp = os.getenv("PCB_AI_TEMPERATURE")
    return float(env_temp) if env_temp else kwargs_temp


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, prompt: str, **kwargs) -> str: ...

    @abstractmethod
    def chat(self, messages: List[Dict], **kwargs) -> str: ...

# ─────────────────────────────────────────────
# LM Studio (OpenAI-compatible)
# ─────────────────────────────────────────────
class LMStudioProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:1234", model: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self._model = model

    def _get_model(self) -> str:
        if self._model: return self._model
        r = requests.get(f"{self.base_url}/v1/models", timeout=5)
        r.raise_for_status()
        models = r.json().get("data", [])
        if not models: raise RuntimeError("LM Studio: no models loaded.")
        return models[0]["id"]

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        payload = {
            "model": self._get_model(),
            "messages": messages,
            "temperature": _get_temperature(temperature),
            "max_tokens": _get_max_tokens(max_tokens)
        }
        r = requests.post(f"{self.base_url}/v1/chat/completions", json=payload, timeout=120)
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
        content = msg.get("content", "").strip()
        if not content:
            content = msg.get("reasoning_content", "").strip()
        return content

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# Ollama
# ─────────────────────────────────────────────
class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": _get_temperature(temperature),
                "num_predict": _get_max_tokens(max_tokens)
            }
        }
        r = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=120)
        r.raise_for_status()
        return r.json()["message"]["content"].strip()

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# OpenAI
# ─────────────────────────────────────────────
class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = model

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        if not self.api_key: raise RuntimeError("OPENAI_API_KEY not set")
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "messages": messages,
                  "temperature": _get_temperature(temperature), "max_tokens": _get_max_tokens(max_tokens)},
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# Anthropic (Claude)
# ─────────────────────────────────────────────
class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-sonnet-20240620"):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.model = model

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        if not self.api_key: raise RuntimeError("ANTHROPIC_API_KEY not set")
        # Anthropic expects 'system' out of band and strictly alternating user/assistant
        system_text = ""
        filtered_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_text += m["content"] + "\n"
            else:
                filtered_msgs.append(m)
        
        payload = {
            "model": self.model,
            "max_tokens": _get_max_tokens(max_tokens),
            "temperature": _get_temperature(temperature),
            "messages": filtered_msgs,
        }
        if system_text:
            payload["system"] = system_text.strip()
            
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json=payload,
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["content"][0]["text"].strip()

    def complete(self, prompt: str, **kwargs) -> str:
        return self.chat([{"role": "user", "content": prompt}], **kwargs)


# ─────────────────────────────────────────────
# Gemini (Google)
# ─────────────────────────────────────────────
class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.model = model

    def chat(self, messages: List[Dict], temperature: float = 0.2, max_tokens: int = 512, **kwargs) -> str:
        if not self.api_key: raise RuntimeError("GEMINI_API_KEY not set")
        # Format messages for Gemini API
        contents = []
        for m in messages:
            role = "user" if m["role"] in ["user", "system"] else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
            
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": _get_temperature(temperature),
                "maxOutputTokens": _get_max_tokens(max_tokens)
            }
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        r = requests.post(url, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

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
        return LMStudioProvider(
            base_url=os.getenv("LMSTUDIO_URL", "http://localhost:1234"),
            model=os.getenv("PCB_AI_MODEL") or os.getenv("LMSTUDIO_MODEL")
        )
    elif name == "ollama":
        return OllamaProvider(
            base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
            model=os.getenv("PCB_AI_MODEL", "llama3")
        )
    elif name == "openai":
        return OpenAIProvider(model=os.getenv("PCB_AI_MODEL", "gpt-4o-mini"))
    elif name == "anthropic" or name == "claude":
        return AnthropicProvider(model=os.getenv("PCB_AI_MODEL", "claude-3-5-sonnet-20240620"))
    elif name == "gemini":
        return GeminiProvider(model=os.getenv("PCB_AI_MODEL", "gemini-1.5-flash"))
        
    return DummyProvider()
