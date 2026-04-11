from dataclasses import dataclass, field
from typing import Any, Protocol, TypeVar

from pydantic import BaseModel


T = TypeVar("T", bound=BaseModel)


class ProviderNotConfiguredError(RuntimeError):
    pass


class ProviderExecutionError(RuntimeError):
    pass


@dataclass(slots=True)
class StructuredProviderRequest:
    capability: str
    model: str
    system_prompt: str
    input_payload: dict[str, Any]
    response_model: type[T]
    request_id: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class StructuredProviderResponse:
    data: BaseModel
    provider: str
    model: str
    token_usage: dict[str, Any] | None = None
    raw_response: dict[str, Any] | None = None


class StructuredLLMProvider(Protocol):
    async def generate_structured(
        self,
        request: StructuredProviderRequest,
    ) -> StructuredProviderResponse: ...
