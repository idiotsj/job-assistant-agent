import asyncio
import json
from pathlib import Path
import sys


AI_SERVICE_ROOT = Path(__file__).resolve().parents[2]

if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.core.config import get_settings
from app.dependencies import build_runtime
from app.pipelines import PipelineContext
from app.pipelines.daily_advice import run_daily_advice_pipeline
from app.pipelines.job_scoring import run_job_scoring_pipeline
from app.pipelines.resume_parse import run_resume_parse_pipeline
from app.providers import OpenAIStructuredProvider
from app.repositories import InMemoryAiRunLogRepository
from app.schemas.daily_advice import DailyAdviceRequest
from app.schemas.recommendation import JobScoringRequest
from app.schemas.resume import ResumeParseRequest


SAMPLES_ROOT = Path(__file__).resolve().parent / "samples"


def _load_samples(name: str):
    return json.loads((SAMPLES_ROOT / name).read_text(encoding="utf-8"))


async def main() -> None:
    settings = get_settings()
    runtime = build_runtime(
        settings=settings,
        provider=OpenAIStructuredProvider(settings),
        ai_run_logs=InMemoryAiRunLogRepository(log_mode="minimal"),
    )

    resume_results = []
    for sample in _load_samples("resume_parse_samples.json"):
        result = await run_resume_parse_pipeline(
            ResumeParseRequest.model_validate(sample["input"]),
            runtime,
            PipelineContext(request_id=f"eval-resume-{sample['id']}", user_id=sample.get("userId")),
        )
        resume_results.append(
            {
                "id": sample["id"],
                "meta": result.meta.model_dump(),
                "parsed": result.data.parsed.model_dump(),
                "patch": result.data.patch.model_dump(),
            }
        )

    scoring_results = []
    for sample in _load_samples("job_scoring_samples.json"):
        result = await run_job_scoring_pipeline(
            JobScoringRequest.model_validate(sample["input"]),
            runtime,
            PipelineContext(request_id=f"eval-score-{sample['id']}", user_id=sample.get("userId")),
        )
        scoring_results.append(
            {
                "id": sample["id"],
                "meta": result.meta.model_dump(),
                "items": [item.model_dump() for item in result.data.items],
            }
        )

    daily_advice_results = []
    for sample in _load_samples("daily_advice_samples.json"):
        result = await run_daily_advice_pipeline(
            DailyAdviceRequest.model_validate(sample["input"]),
            runtime,
            PipelineContext(request_id=f"eval-daily-{sample['id']}", user_id=sample.get("userId")),
        )
        daily_advice_results.append(
            {
                "id": sample["id"],
                "meta": result.meta.model_dump(),
                "advice": result.data.model_dump(),
            }
        )

    print(
        json.dumps(
            {
                "resume_parse": resume_results,
                "job_scoring": scoring_results,
                "daily_advice": daily_advice_results,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
