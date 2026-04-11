from fastapi import FastAPI

from app.api.routes import router
from app.dependencies import AiServiceRuntime, build_runtime


def create_app(runtime: AiServiceRuntime | None = None) -> FastAPI:
    resolved_runtime = runtime or build_runtime()
    settings = resolved_runtime.settings

    app = FastAPI(
        title=settings.service_name,
        version="0.1.0",
        description="Internal AI capability layer for recommendation and resume parsing.",
    )
    app.state.runtime = resolved_runtime
    app.include_router(router)
    return app


app = create_app()
