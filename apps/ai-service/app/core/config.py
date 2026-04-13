from functools import lru_cache
from os import getenv
from typing import Literal

from pydantic import BaseModel


def _clean_env(name: str) -> str | None:
    value = getenv(name)
    if value is None:
        return None

    value = value.strip()
    return value or None


class Settings(BaseModel):
    service_name: str
    environment: str
    database_url: str | None = None
    ai_log_mode: Literal["full", "minimal", "debug-full"]
    internal_service_token: str | None = None
    openai_api_key: str | None = None
    openai_base_url: str
    openai_model_resume_parse: str
    openai_model_resume_diagnosis: str
    openai_model_job_scoring: str
    openai_model_daily_advice: str

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    environment = _clean_env("AI_SERVICE_ENV") or "development"
    default_log_mode = "minimal" if environment.lower() == "production" else "full"

    return Settings(
        service_name=_clean_env("AI_SERVICE_NAME") or "job-assistant-ai",
        environment=environment,
        database_url=_clean_env("DATABASE_URL"),
        ai_log_mode=_clean_env("AI_LOG_MODE") or default_log_mode,
        internal_service_token=_clean_env("AI_INTERNAL_SERVICE_TOKEN"),
        openai_api_key=_clean_env("OPENAI_API_KEY"),
        openai_base_url=_clean_env("OPENAI_BASE_URL") or "https://api.openai.com/v1",
        openai_model_resume_parse=_clean_env("OPENAI_MODEL_RESUME_PARSE") or "gpt-4.1-mini",
        openai_model_resume_diagnosis=_clean_env("OPENAI_MODEL_RESUME_DIAGNOSIS") or "gpt-4.1-mini",
        openai_model_job_scoring=_clean_env("OPENAI_MODEL_JOB_SCORING") or "gpt-4.1-mini",
        openai_model_daily_advice=_clean_env("OPENAI_MODEL_DAILY_ADVICE") or "gpt-4.1-mini",
    )


def reset_settings_cache() -> None:
    get_settings.cache_clear()
