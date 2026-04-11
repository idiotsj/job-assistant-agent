from typing import Any

from pydantic import BaseModel, Field


class PipelineMeta(BaseModel):
    provider: str
    model: str
    promptVersion: str
    latencyMs: int = Field(ge=0)
    fallbackUsed: bool = False
    tokenUsage: dict[str, Any] | None = None
