from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Settings:
    # General
    log_level: str = os.getenv("PCB_AI_LOG", "INFO")

    # LLM
    llm_provider: str = os.getenv("PCB_AI_LLM_PROVIDER", "openai")
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    # Paths
    workdir: str = os.getenv("PCB_AI_WORKDIR", os.path.abspath("build"))

    # EDA tool backends
    kicad_cli: str = os.getenv("KICAD_CLI", "kicad-cli")
    altium_api_key: Optional[str] = os.getenv("ALTIUM_API_KEY")
    cadence_api_key: Optional[str] = os.getenv("CADENCE_API_KEY")


settings = Settings()
