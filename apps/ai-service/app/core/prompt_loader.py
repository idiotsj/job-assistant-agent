from functools import lru_cache
from pathlib import Path


PROMPTS_ROOT = Path(__file__).resolve().parents[1] / "prompts"


@lru_cache
def load_prompt(capability: str, version: str) -> str:
    prompt_path = PROMPTS_ROOT / capability / f"{version}.md"
    return prompt_path.read_text(encoding="utf-8").strip()
