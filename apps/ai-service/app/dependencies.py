from dataclasses import dataclass

from fastapi import Request

from app.core.config import Settings, get_settings
from app.core.logger import configure_logging
from app.providers import OpenAIStructuredProvider, StructuredLLMProvider
from app.repositories import AiRunLogRepository, NoopAiRunLogRepository, PostgresAiRunLogRepository


@dataclass(slots=True)
class AiServiceRuntime:
    settings: Settings
    provider: StructuredLLMProvider
    ai_run_logs: AiRunLogRepository


def build_runtime(
    settings: Settings | None = None,
    provider: StructuredLLMProvider | None = None,
    ai_run_logs: AiRunLogRepository | None = None,
) -> AiServiceRuntime:
    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings)

    resolved_provider = provider or OpenAIStructuredProvider(resolved_settings)
    resolved_repository = ai_run_logs
    if resolved_repository is None:
        if resolved_settings.database_url:
            resolved_repository = PostgresAiRunLogRepository(
                resolved_settings.database_url,
                resolved_settings.ai_log_mode,
            )
        else:
            resolved_repository = NoopAiRunLogRepository()

    return AiServiceRuntime(
        settings=resolved_settings,
        provider=resolved_provider,
        ai_run_logs=resolved_repository,
    )


def get_runtime(request: Request) -> AiServiceRuntime:
    return request.app.state.runtime
