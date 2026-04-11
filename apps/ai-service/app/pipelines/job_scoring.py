from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.core.prompt_loader import load_prompt
from app.dependencies import AiServiceRuntime
from app.pipelines.types import PipelineContext, PipelineResult
from app.providers import ProviderExecutionError, ProviderNotConfiguredError, StructuredProviderRequest
from app.repositories import AiRunLogEntry
from app.schemas.common import PipelineMeta
from app.schemas.recommendation import (
    JobPayload,
    JobScoreItem,
    JobScoringRequest,
    JobScoringResponseData,
    ProfilePayload,
)


logger = get_logger("pipelines.job_scoring")

PIPELINE_NAME = "job_scoring"
PROMPT_VERSION = "v1"
MAX_SCORE_DELTA = 15


class JobScoreEnhancementItem(BaseModel):
    jobId: str
    scoreDelta: int = Field(ge=-MAX_SCORE_DELTA, le=MAX_SCORE_DELTA)
    reason: str = ""
    signals: list[str] = Field(default_factory=list)


class JobScoreEnhancementResponse(BaseModel):
    items: list[JobScoreEnhancementItem] = Field(default_factory=list)


def _normalize_tokens(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _safe_parse_date(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def _days_until(value: str | None, now: datetime) -> int | None:
    parsed = _safe_parse_date(value)
    if not parsed:
        return None

    delta = parsed - now
    return int(delta.total_seconds() // 86400) + (1 if delta.total_seconds() % 86400 > 0 else 0)


def _score_single_job(job: JobPayload, profile: ProfilePayload | None, now: datetime) -> JobScoreItem:
    if profile is None:
        profile = ProfilePayload()

    score = 0
    reasons: list[str] = []
    signals: list[str] = []

    industries = _normalize_tokens(profile.targetIndustries)
    cities = _normalize_tokens(profile.targetCities)
    skills = _normalize_tokens(profile.skills)
    preferred_types = _normalize_tokens(profile.preferredJobTypes)
    job_tags = _normalize_tokens(job.tags + [job.title])
    required_skills = _normalize_tokens(job.requiredSkills)

    if job.companyIndustry.strip().lower() in industries:
        score += 35
        reasons.append("行业匹配")
        signals.append("industry_match")

    if job.workLocation.strip().lower() in cities:
        score += 25
        reasons.append("城市匹配")
        signals.append("city_match")

    if required_skills:
        overlap = len(required_skills & skills)
        skill_score = round((overlap / len(required_skills)) * 25)
        score += skill_score
        if skill_score > 0:
            reasons.append("技能契合")
            signals.append("skill_overlap")

    preferred_overlap = preferred_types & job_tags
    if preferred_overlap:
        score += 10
        reasons.append("方向接近")
        signals.append("preferred_job_type")

    if job.isFeatured:
        score += 10
        reasons.append("精选岗位")
        signals.append("featured")

    published_days = _days_until(job.publishedAt, now)
    if published_days is not None and published_days >= -7:
        score += 5
        reasons.append("近期发布")
        signals.append("freshness")

    deadline_days = _days_until(job.deadline, now)
    if deadline_days is not None and 0 <= deadline_days <= 7:
        score += 5
        reasons.append("即将截止")
        signals.append("deadline")

    score = max(0, min(score, 100))

    return JobScoreItem(
        jobId=job.id,
        score=score,
        reason="，".join(reasons) if reasons else "规则基线推荐",
        signals=signals,
    )


def _build_rule_based_result(payload: JobScoringRequest) -> JobScoringResponseData:
    now = datetime.now(timezone.utc)
    items = [_score_single_job(job, payload.profile, now) for job in payload.jobs]
    ranked = sorted(items, key=lambda item: item.score, reverse=True)
    return JobScoringResponseData(items=ranked)


def _build_error_payload(error: Exception) -> dict[str, Any]:
    return {
        "errorType": error.__class__.__name__,
        "errorMessage": str(error),
    }


def _merge_with_enhancement(
    baseline: JobScoringResponseData,
    enhancement: JobScoreEnhancementResponse,
) -> JobScoringResponseData:
    enhancement_map = {item.jobId: item for item in enhancement.items}
    merged: list[JobScoreItem] = []

    for item in baseline.items:
        current = enhancement_map.get(item.jobId)
        if not current:
            merged.append(item)
            continue

        merged.append(
            JobScoreItem(
                jobId=item.jobId,
                score=max(0, min(100, item.score + current.scoreDelta)),
                reason=current.reason or item.reason,
                signals=list(dict.fromkeys([*item.signals, *current.signals])),
            )
        )

    merged.sort(key=lambda entry: entry.score, reverse=True)
    return JobScoringResponseData(items=merged)


def _write_log(runtime: AiServiceRuntime, entry: AiRunLogEntry) -> None:
    try:
        runtime.ai_run_logs.write(entry)
    except Exception as error:  # pragma: no cover - best effort logging
        logger.warning("Failed to persist ai_run_logs entry", extra={"error": str(error)})


async def run_job_scoring_pipeline(
    payload: JobScoringRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[JobScoringResponseData]:
    started_at = perf_counter()
    baseline = _build_rule_based_result(payload)
    fallback_used = False
    provider_name = "rule-based"
    model_name = "rule-based"
    token_usage = None
    error_payload = None

    try:
        prompt = load_prompt(PIPELINE_NAME, PROMPT_VERSION)
        if payload.jobs:
            try:
                provider_response = await runtime.provider.generate_structured(
                    StructuredProviderRequest(
                        capability=PIPELINE_NAME,
                        model=runtime.settings.openai_model_job_scoring,
                        system_prompt=prompt,
                        input_payload=payload.model_dump(),
                        response_model=JobScoreEnhancementResponse,
                        request_id=context.request_id,
                        user_id=context.user_id,
                        metadata={"promptVersion": PROMPT_VERSION},
                    )
                )
                enhancement = JobScoreEnhancementResponse.model_validate(provider_response.data)
                data = _merge_with_enhancement(baseline, enhancement)
                provider_name = provider_response.provider
                model_name = provider_response.model
                token_usage = provider_response.token_usage
            except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
                fallback_used = True
                error_payload = _build_error_payload(error)
                data = baseline
                logger.info("Job scoring pipeline fell back to rule-based mode", extra=error_payload)
        else:
            data = baseline

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
                capability="job_scoring",
                pipeline=PIPELINE_NAME,
                provider=provider_name,
                model=model_name,
                prompt_version=PROMPT_VERSION,
                status="succeeded",
                request_id=context.request_id,
                user_id=context.user_id,
                input_json=payload.model_dump(),
                output_json={
                    "data": data.model_dump(),
                    "meta": meta.model_dump(),
                },
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
                capability="job_scoring",
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
