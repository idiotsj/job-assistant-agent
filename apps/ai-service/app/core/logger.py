import logging

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    root_logger = logging.getLogger("job_assistant_ai")
    if root_logger.handlers:
        return

    level = logging.DEBUG if settings.environment.lower() == "development" else logging.INFO
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
        )
    )
    root_logger.setLevel(level)
    root_logger.addHandler(handler)


def get_logger(name: str = "app") -> logging.Logger:
    return logging.getLogger(f"job_assistant_ai.{name}")
