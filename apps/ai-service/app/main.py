from fastapi import FastAPI

from app.api.routes import router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.service_name,
    version="0.1.0",
    description="Internal AI capability layer for recommendation and resume parsing.",
)

app.include_router(router)
