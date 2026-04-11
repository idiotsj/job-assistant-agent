from dataclasses import dataclass
from typing import Generic, TypeVar

from app.schemas.common import PipelineMeta


T = TypeVar("T")


@dataclass(slots=True)
class PipelineContext:
    request_id: str | None = None
    user_id: str | None = None


@dataclass(slots=True)
class PipelineResult(Generic[T]):
    data: T
    meta: PipelineMeta
