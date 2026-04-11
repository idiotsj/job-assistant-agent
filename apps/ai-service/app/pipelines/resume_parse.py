from time import perf_counter
from typing import Any

from app.core.logger import get_logger
from app.core.prompt_loader import load_prompt
from app.dependencies import AiServiceRuntime
from app.pipelines.types import PipelineContext, PipelineResult
from app.providers import ProviderExecutionError, ProviderNotConfiguredError, StructuredProviderRequest
from app.repositories import AiRunLogEntry
from app.schemas.common import PipelineMeta
from app.schemas.resume import (
    ResumeEducation,
    ResumeParseRequest,
    ResumeParseResponseData,
    ResumeParseResult,
    ResumePatchSuggestion,
)


logger = get_logger("pipelines.resume_parse")

PIPELINE_NAME = "resume_parse"
PROMPT_VERSION = "v1"

SKILL_KEYWORDS = [
    "Python",
    "TypeScript",
    "JavaScript",
    "React",
    "Vue",
    "SQL",
    "FastAPI",
    "Node.js",
    "Java",
]

JOB_TYPE_KEYWORDS = [
    "前端开发",
    "后端开发",
    "产品经理",
    "数据分析",
    "算法工程师",
    "运营",
]

CITY_KEYWORDS = [
    "上海",
    "北京",
    "深圳",
    "杭州",
    "广州",
    "南京",
]

UNIVERSITY_KEYWORDS = [
    "复旦大学",
    "上海交通大学",
    "同济大学",
    "浙江大学",
    "北京大学",
    "清华大学",
]

MAJOR_KEYWORDS = [
    "计算机科学",
    "软件工程",
    "信息管理",
    "数据科学",
    "统计学",
]


def _extract_matches(text: str, candidates: list[str]) -> list[str]:
    return [candidate for candidate in candidates if candidate.lower() in text.lower()]


def _build_rule_based_result(payload: ResumeParseRequest) -> ResumeParseResponseData:
    raw_text = payload.rawText.strip()

    detected_skills = _extract_matches(raw_text, SKILL_KEYWORDS)
    detected_job_types = _extract_matches(raw_text, JOB_TYPE_KEYWORDS)
    detected_cities = _extract_matches(raw_text, CITY_KEYWORDS)
    universities = _extract_matches(raw_text, UNIVERSITY_KEYWORDS)
    majors = _extract_matches(raw_text, MAJOR_KEYWORDS)

    summary_parts = []
    if detected_skills:
        summary_parts.append(f"识别到 {len(detected_skills)} 项技能")
    if detected_job_types:
        summary_parts.append(f"岗位方向偏向 {detected_job_types[0]}")
    if detected_cities:
        summary_parts.append(f"出现目标城市 {detected_cities[0]}")

    summary = "；".join(summary_parts) if summary_parts else "已完成基础简历解析，建议结合 LLM 做进一步结构化抽取。"

    confidence = min(
        0.95,
        0.35
        + len(detected_skills) * 0.08
        + len(detected_job_types) * 0.1
        + len(detected_cities) * 0.05,
    )

    return ResumeParseResponseData(
        parsed=ResumeParseResult(
            summary=summary,
            detectedSkills=detected_skills,
            detectedJobTypes=detected_job_types,
            detectedCities=detected_cities,
            education=ResumeEducation(
                university=universities[0] if universities else None,
                major=majors[0] if majors else None,
            ),
            confidence=round(confidence, 2),
        ),
        patch=ResumePatchSuggestion(
            university=universities[0] if universities else None,
            major=majors[0] if majors else None,
            skills=detected_skills,
            preferredJobTypes=detected_job_types,
            targetCities=detected_cities,
        ),
    )


def _build_error_payload(error: Exception) -> dict[str, Any]:
    return {
        "errorType": error.__class__.__name__,
        "errorMessage": str(error),
    }


def _write_log(runtime: AiServiceRuntime, entry: AiRunLogEntry) -> None:
    try:
        runtime.ai_run_logs.write(entry)
    except Exception as error:  # pragma: no cover - best effort logging
        logger.warning("Failed to persist ai_run_logs entry", extra={"error": str(error)})


async def run_resume_parse_pipeline(
    payload: ResumeParseRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[ResumeParseResponseData]:
    started_at = perf_counter()
    fallback_used = False
    provider_name = "rule-based"
    model_name = "rule-based"
    token_usage = None
    error_payload = None

    try:
        prompt = load_prompt(PIPELINE_NAME, PROMPT_VERSION)
        try:
            provider_response = await runtime.provider.generate_structured(
                StructuredProviderRequest(
                    capability=PIPELINE_NAME,
                    model=runtime.settings.openai_model_resume_parse,
                    system_prompt=prompt,
                    input_payload=payload.model_dump(),
                    response_model=ResumeParseResponseData,
                    request_id=context.request_id,
                    user_id=context.user_id,
                    metadata={"promptVersion": PROMPT_VERSION},
                )
            )
            data = ResumeParseResponseData.model_validate(provider_response.data)
            provider_name = provider_response.provider
            model_name = provider_response.model
            token_usage = provider_response.token_usage
        except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
            fallback_used = True
            error_payload = _build_error_payload(error)
            data = _build_rule_based_result(payload)
            logger.info("Resume parse pipeline fell back to rule-based mode", extra=error_payload)

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
                capability="resume_parse",
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
                capability="resume_parse",
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
