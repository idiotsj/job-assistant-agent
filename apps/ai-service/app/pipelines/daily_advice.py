from time import perf_counter
from typing import Any

from app.core.logger import get_logger
from app.core.prompt_loader import load_prompt
from app.dependencies import AiServiceRuntime
from app.pipelines.types import PipelineContext, PipelineResult
from app.providers import ProviderExecutionError, ProviderNotConfiguredError, StructuredProviderRequest
from app.repositories import AiRunLogEntry
from app.schemas.common import PipelineMeta
from app.schemas.daily_advice import DailyAdviceRequest, DailyAdviceResult


logger = get_logger("pipelines.daily_advice")

PIPELINE_NAME = "daily_advice"
PROMPT_VERSION = "v1"


def _build_rule_based_result(payload: DailyAdviceRequest) -> DailyAdviceResult:
    profile = payload.profile
    featured_job = payload.featuredJobs[0] if payload.featuredJobs else None
    company = payload.featuredCompany
    curated = payload.curatedAdvice

    if profile and profile.targetCities and profile.targetIndustries:
        return DailyAdviceResult(
            title=f"今天先聚焦 {profile.targetCities[0]} 的 {profile.targetIndustries[0]} 机会",
            body=(
                f"你当前的目标城市和行业已经比较明确，优先处理高匹配岗位，"
                f"并把简历项目描述改成更贴近 {profile.targetIndustries[0]} 场景的表达。"
            ),
            source="ai-fallback",
        )

    if featured_job:
        return DailyAdviceResult(
            title=f"优先处理 {featured_job.title} 相关准备",
            body=(
                f"今天可以围绕 {featured_job.companyName} 的 {featured_job.title} 做一次针对性准备，"
                "梳理与你最相关的项目和技能证据。"
            ),
            source="ai-fallback",
        )

    if company:
        return DailyAdviceResult(
            title=f"关注 {company.name} 的最新机会",
            body=(
                f"{company.name} 当前是值得优先关注的企业，先了解它在 {company.industry} 方向上的岗位要求，"
                "再决定今天的投递顺序。"
            ),
            source="ai-fallback",
        )

    if curated:
        return DailyAdviceResult(
            title=curated.title,
            body=curated.body,
            source="curated",
        )

    return DailyAdviceResult(
        title="先完善画像，再开始今天的投递",
        body="补全目标城市、目标行业和技能标签后，岗位与案例推荐会明显更精准。",
        source="fallback",
    )


def _build_error_payload(error: Exception) -> dict[str, Any]:
    return {
        "errorType": error.__class__.__name__,
        "errorMessage": str(error),
    }


def _write_log(runtime: AiServiceRuntime, entry: AiRunLogEntry) -> None:
    try:
        runtime.ai_run_logs.write(entry)
    except Exception as error:  # pragma: no cover
        logger.warning("Failed to persist ai_run_logs entry", extra={"error": str(error)})


async def run_daily_advice_pipeline(
    payload: DailyAdviceRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[DailyAdviceResult]:
    started_at = perf_counter()
    provider_name = "rule-based"
    model_name = "rule-based"
    token_usage = None
    error_payload = None
    fallback_used = False

    try:
        prompt = load_prompt(PIPELINE_NAME, PROMPT_VERSION)
        try:
            provider_response = await runtime.provider.generate_structured(
                StructuredProviderRequest(
                    capability=PIPELINE_NAME,
                    model=runtime.settings.openai_model_daily_advice,
                    system_prompt=prompt,
                    input_payload=payload.model_dump(),
                    response_model=DailyAdviceResult,
                    request_id=context.request_id,
                    user_id=context.user_id,
                    metadata={"promptVersion": PROMPT_VERSION},
                )
            )
            data = DailyAdviceResult.model_validate(provider_response.data)
            provider_name = provider_response.provider
            model_name = provider_response.model
            token_usage = provider_response.token_usage
        except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
            fallback_used = True
            error_payload = _build_error_payload(error)
            data = _build_rule_based_result(payload)
            logger.info("Daily advice pipeline fell back to rule-based mode", extra=error_payload)

        latency_ms = int((perf_counter() - started_at) * 1000)
        meta = PipelineMeta(
            provider=provider_name,
            model=model_name,
            promptVersion=PROMPT_VERSION,
            latencyMs=latency_ms,
            fallbackUsed=fallback_used,
            tokenUsage=token_usage,
        )
        _write_log(
            runtime,
            AiRunLogEntry(
                capability="daily_advice",
                pipeline=PIPELINE_NAME,
                provider=provider_name,
                model=model_name,
                prompt_version=PROMPT_VERSION,
                status="succeeded",
                request_id=context.request_id,
                user_id=context.user_id,
                input_json=payload.model_dump(),
                output_json={"data": data.model_dump(), "meta": meta.model_dump()},
                error_json=error_payload,
                token_usage_json=token_usage,
                latency_ms=latency_ms,
            ),
        )
        return PipelineResult(data=data, meta=meta)
    except Exception as error:
        latency_ms = int((perf_counter() - started_at) * 1000)
        _write_log(
            runtime,
            AiRunLogEntry(
                capability="daily_advice",
                pipeline=PIPELINE_NAME,
                provider=provider_name,
                model=model_name,
                prompt_version=PROMPT_VERSION,
                status="failed",
                request_id=context.request_id,
                user_id=context.user_id,
                input_json=payload.model_dump(),
                output_json=None,
                error_json=_build_error_payload(error),
                token_usage_json=token_usage,
                latency_ms=latency_ms,
            ),
        )
        raise
