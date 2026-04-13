import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal, Protocol

from app.core.db import connect


AiRunStatus = Literal["succeeded", "failed"]
AiLogMode = Literal["full", "minimal", "debug-full"]

SENSITIVE_STRING_KEYS = {
    "rawText",
}

SENSITIVE_OBJECT_KEYS = {
    "profile",
    "parsedResume",
    "parsed",
    "patch",
    "education",
}


@dataclass(slots=True)
class AiRunLogEntry:
    capability: str
    pipeline: str
    provider: str
    model: str
    prompt_version: str
    status: AiRunStatus
    request_id: str | None
    user_id: str | None
    input_json: Any
    output_json: Any
    error_json: Any
    token_usage_json: Any
    latency_ms: int
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class AiRunLogRepository(Protocol):
    def write(self, entry: AiRunLogEntry) -> None: ...


def summarize_structure(value: Any) -> Any:
    if value is None:
        return None

    if isinstance(value, str):
        return {
            "type": "string",
            "length": len(value),
        }

    if isinstance(value, list):
        return {
            "type": "list",
            "length": len(value),
        }

    if isinstance(value, dict):
        return {
            "type": "object",
            "keys": list(value.keys())[:20],
            "size": len(value),
        }

    return {
        "type": type(value).__name__,
    }


def _redact_string(value: Any) -> Any:
    if isinstance(value, str):
        return {
            "redacted": True,
            "type": "string",
            "length": len(value),
        }

    return {
        "redacted": True,
        "summary": summarize_structure(value),
    }


def sanitize_payload(value: Any, key: str | None = None) -> Any:
    if key in SENSITIVE_STRING_KEYS:
        return _redact_string(value)

    if key in SENSITIVE_OBJECT_KEYS:
        return {
            "redacted": True,
            "summary": summarize_structure(value),
        }

    if isinstance(value, list):
        return [sanitize_payload(item, key) for item in value]

    if isinstance(value, dict):
        return {
            item_key: sanitize_payload(item_value, item_key)
            for item_key, item_value in value.items()
        }

    return value


def summarize_payload(value: Any) -> Any:
    if value is None:
        return None

    if isinstance(value, str):
        return {
            "type": "string",
            "length": len(value),
            "preview": value[:300],
        }

    if isinstance(value, list):
        return {
            "type": "list",
            "length": len(value),
            "preview": [summarize_payload(item) for item in value[:5]],
        }

    if isinstance(value, dict):
        return {
            "type": "object",
            "keys": list(value.keys())[:20],
            "preview": {
                key: summarize_payload(item)
                for key, item in list(value.items())[:10]
            },
        }

    return value


def _prepare_payload(log_mode: AiLogMode, value: Any) -> Any:
    if log_mode == "debug-full":
        return value

    sanitized = sanitize_payload(value)
    if log_mode == "full":
        return sanitized

    return summarize_payload(sanitized)


class NoopAiRunLogRepository(AiRunLogRepository):
    def write(self, entry: AiRunLogEntry) -> None:
        return None


class InMemoryAiRunLogRepository(AiRunLogRepository):
    def __init__(self, log_mode: AiLogMode = "full"):
        self._log_mode = log_mode
        self.entries: list[AiRunLogEntry] = []

    def write(self, entry: AiRunLogEntry) -> None:
        self.entries.append(
            AiRunLogEntry(
                capability=entry.capability,
                pipeline=entry.pipeline,
                provider=entry.provider,
                model=entry.model,
                prompt_version=entry.prompt_version,
                status=entry.status,
                request_id=entry.request_id,
                user_id=entry.user_id,
                input_json=_prepare_payload(self._log_mode, entry.input_json),
                output_json=_prepare_payload(self._log_mode, entry.output_json),
                error_json=_prepare_payload(self._log_mode, entry.error_json),
                token_usage_json=_prepare_payload(self._log_mode, entry.token_usage_json),
                latency_ms=entry.latency_ms,
                created_at=entry.created_at,
            )
        )


class PostgresAiRunLogRepository(AiRunLogRepository):
    def __init__(self, database_url: str, log_mode: AiLogMode):
        self._database_url = database_url
        self._log_mode = log_mode

    def write(self, entry: AiRunLogEntry) -> None:
        with connect(self._database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO ai_run_logs (
                      capability,
                      pipeline,
                      provider,
                      model,
                      prompt_version,
                      status,
                      request_id,
                      user_id,
                      input_json,
                      output_json,
                      error_json,
                      token_usage_json,
                      latency_ms,
                      created_at
                    ) VALUES (
                      %s, %s, %s, %s, %s, %s, %s, %s,
                      %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb, %s, %s
                    )
                    """,
                    (
                        entry.capability,
                        entry.pipeline,
                        entry.provider,
                        entry.model,
                        entry.prompt_version,
                        entry.status,
                        entry.request_id,
                        entry.user_id,
                        json.dumps(_prepare_payload(self._log_mode, entry.input_json), ensure_ascii=False)
                        if entry.input_json is not None
                        else None,
                        json.dumps(_prepare_payload(self._log_mode, entry.output_json), ensure_ascii=False)
                        if entry.output_json is not None
                        else None,
                        json.dumps(_prepare_payload(self._log_mode, entry.error_json), ensure_ascii=False)
                        if entry.error_json is not None
                        else None,
                        json.dumps(_prepare_payload(self._log_mode, entry.token_usage_json), ensure_ascii=False)
                        if entry.token_usage_json is not None
                        else None,
                        entry.latency_ms,
                        entry.created_at,
                    ),
                )
            connection.commit()
