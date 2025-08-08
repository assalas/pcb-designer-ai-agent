from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, Any


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, prompt: str, **kwargs) -> str:
        ...


class DummyProvider(LLMProvider):
    def complete(self, prompt: str, **kwargs) -> str:
        return "TODO: implement real provider or configure via env"
