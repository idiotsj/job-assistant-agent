from functools import lru_cache
from os import getenv

from pydantic import BaseModel


class Settings(BaseModel):
    service_name: str
    environment: str


@lru_cache
def get_settings() -> Settings:
    return Settings(
        service_name=getenv("AI_SERVICE_NAME", "job-assistant-ai"),
        environment=getenv("AI_SERVICE_ENV", "development"),
    )
