import re
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from app.core.logger import get_logger
from app.core.prompt_loader import load_prompt
from app.dependencies import AiServiceRuntime
from app.pipelines.types import PipelineContext, PipelineResult
from app.providers import ProviderExecutionError, ProviderNotConfiguredError, StructuredProviderRequest
from app.repositories import AiRunLogEntry
from app.schemas.common import PipelineMeta
from app.schemas.recommendation import ProfilePayload
from app.schemas.resume_diagnosis import (
    ResumeDiagnosisActionPlan,
    ResumeDiagnosisAlignment,
    ResumeDiagnosisQuality,
    ResumeDiagnosisRequest,
    ResumeDiagnosisResult,
)


logger = get_logger("pipelines.resume_diagnosis")

PIPELINE_NAME = "resume_diagnosis"
PROMPT_VERSION = "v1"


def _merge_unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for value in values:
        normalized = value.strip()
        if not normalized:
            continue
        lowered = normalized.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        merged.append(normalized)
    return merged


def _overlap(left: list[str], right: list[str]) -> list[str]:
    right_index = {item.strip().lower(): item.strip() for item in right if item.strip()}
    matched: list[str] = []
    for item in left:
        normalized = item.strip().lower()
        if normalized and normalized in right_index:
            matched.append(right_index[normalized])
    return _merge_unique(matched)


def _profile_or_default(profile: ProfilePayload | None) -> ProfilePayload:
    return profile or ProfilePayload()


def _build_target_summary(profile: ProfilePayload) -> str:
    parts: list[str] = []
    if profile.preferredJobTypes:
        parts.append(f"目标岗位偏向 {profile.preferredJobTypes[0]}")
    if profile.targetIndustries:
        parts.append(f"目标行业偏向 {profile.targetIndustries[0]}")
    if profile.targetCities:
        parts.append(f"优先城市是 {profile.targetCities[0]}")
    if not parts:
        return "当前画像还不够明确，本次按通用求职简历做诊断。"
    return "；".join(parts)


def _build_quality(payload: ResumeDiagnosisRequest) -> ResumeDiagnosisQuality:
    raw_text = payload.rawText.strip()
    parsed = payload.parsedResume
    strengths: list[str] = []
    risks: list[str] = []
    missing_info: list[str] = []

    if parsed.detectedSkills:
        strengths.append(f"已经识别到 {len(parsed.detectedSkills)} 个技能关键词，可继续强化岗位相关词。")
    else:
        risks.append("技能关键词偏少，HR 很难快速判断你的能力边界。")
        missing_info.append("可直接复用的技能关键词")

    if parsed.education.university or parsed.education.major:
        education_parts = [part for part in [parsed.education.university, parsed.education.major] if part]
        strengths.append(f"教育背景信息较完整：{' / '.join(education_parts)}。")
    else:
        missing_info.append("学校或专业信息")

    if len(raw_text) >= 180:
        strengths.append("简历文本长度基本够用，已经有进一步优化表达的空间。")
    else:
        risks.append("简历内容偏短，重点经历和结果信息可能不够完整。")

    if re.search(r"\d", raw_text):
        strengths.append("文本里出现了数字信息，适合继续强化量化结果。")
    else:
        risks.append("缺少量化结果或明确成果指标，竞争力会被低估。")

    lowered = raw_text.lower()
    if "项目" not in raw_text and "project" not in lowered:
        missing_info.append("项目经历")
    if "实习" not in raw_text and "intern" not in lowered:
        missing_info.append("实习经历")
    if not parsed.detectedJobTypes:
        risks.append("岗位方向表达不够明确，容易显得简历目标分散。")
        missing_info.append("目标岗位表达")

    return ResumeDiagnosisQuality(
        strengths=_merge_unique(strengths)[:4],
        risks=_merge_unique(risks)[:4],
        missingInfo=_merge_unique(missing_info)[:4],
    )


def _build_alignment(payload: ResumeDiagnosisRequest, profile: ProfilePayload) -> ResumeDiagnosisAlignment:
    parsed = payload.parsedResume
    matched_signals: list[str] = []
    gap_signals: list[str] = []

    matched_job_types = _overlap(profile.preferredJobTypes, parsed.detectedJobTypes)
    if matched_job_types:
        matched_signals.append(f"简历表达出的岗位方向与画像目标有交集：{'、'.join(matched_job_types)}。")
    elif profile.preferredJobTypes:
        gap_signals.append("简历里的岗位方向表达和当前求职目标还没有明显对齐。")

    matched_cities = _overlap(profile.targetCities, parsed.detectedCities)
    if matched_cities:
        matched_signals.append(f"简历已出现目标城市信息：{'、'.join(matched_cities)}。")
    elif profile.targetCities:
        gap_signals.append("画像里有目标城市，但简历没有明确体现可投递地区或到岗范围。")

    matched_skills = _overlap(profile.skills, parsed.detectedSkills)
    if matched_skills:
        matched_signals.append(f"简历提到了与你画像一致的技能：{'、'.join(matched_skills[:3])}。")
    elif profile.skills:
        gap_signals.append("画像里的核心技能没有充分出现在简历关键词中。")

    if not profile.preferredJobTypes and not profile.targetCities and not profile.targetIndustries:
        gap_signals.append("当前画像还比较空，诊断只能给通用建议，后续建议先补全求职目标。")

    return ResumeDiagnosisAlignment(
        targetSummary=_build_target_summary(profile),
        matchedSignals=_merge_unique(matched_signals)[:4],
        gapSignals=_merge_unique(gap_signals)[:4],
    )


def _build_action_plan(
    quality: ResumeDiagnosisQuality,
    alignment: ResumeDiagnosisAlignment,
) -> ResumeDiagnosisActionPlan:
    if alignment.gapSignals:
        top_priority = alignment.gapSignals[0]
    elif quality.risks:
        top_priority = quality.risks[0]
    elif quality.missingInfo:
        top_priority = f"先补齐 {quality.missingInfo[0]}"
    else:
        top_priority = "继续按目标岗位 JD 做关键词微调。"

    next_steps: list[str] = []
    if any("量化" in risk or "成果" in risk for risk in quality.risks):
        next_steps.append("给最重要的项目或实习补上 1 到 2 个可量化结果。")
    if any("岗位方向" in risk for risk in quality.risks) or any("岗位方向" in gap for gap in alignment.gapSignals):
        next_steps.append("在简历开头或最近经历里明确你的目标岗位方向。")
    if "项目经历" in quality.missingInfo:
        next_steps.append("补一段最能支撑当前求职方向的项目经历，并突出任务与结果。")
    if "实习经历" in quality.missingInfo:
        next_steps.append("如果有相关实践，单独拆出实习或校内经历，避免简历显得证据不足。")
    if any("城市" in gap for gap in alignment.gapSignals):
        next_steps.append("在简历或投递说明里明确目标城市和到岗意向。")

    if not next_steps:
        next_steps.append("挑 1 个目标岗位 JD，对照岗位要求重排技能和项目顺序。")
        next_steps.append("把最能说明能力的经历放到前半屏，提升首轮筛选效率。")

    return ResumeDiagnosisActionPlan(
        topPriority=top_priority,
        nextSteps=_merge_unique(next_steps)[:4],
    )


def _compute_overall_score(
    payload: ResumeDiagnosisRequest,
    quality: ResumeDiagnosisQuality,
    alignment: ResumeDiagnosisAlignment,
) -> int:
    score = 52
    score += min(len(payload.parsedResume.detectedSkills) * 6, 18)
    if payload.parsedResume.education.university:
        score += 8
    if payload.parsedResume.education.major:
        score += 5
    if re.search(r"\d", payload.rawText):
        score += 8
    if payload.parsedResume.detectedJobTypes:
        score += 6
    score += min(len(alignment.matchedSignals) * 4, 12)
    score -= min(len(quality.risks) * 5, 15)
    score -= min(len(quality.missingInfo) * 3, 9)
    score -= min(len(alignment.gapSignals) * 4, 12)
    return max(0, min(100, score))


def _build_rule_based_result(payload: ResumeDiagnosisRequest) -> ResumeDiagnosisResult:
    profile = _profile_or_default(payload.profile)
    quality = _build_quality(payload)
    alignment = _build_alignment(payload, profile)
    action_plan = _build_action_plan(quality, alignment)
    overall_score = _compute_overall_score(payload, quality, alignment)
    generated_at = datetime.now(timezone.utc).isoformat()

    summary_parts: list[str] = []
    if quality.strengths:
        summary_parts.append("简历已经具备可用基础")
    if alignment.gapSignals:
        summary_parts.append("但和当前目标的对齐还需要继续强化")
    elif quality.risks:
        summary_parts.append("下一步重点是补强表达和证据")
    else:
        summary_parts.append("可以开始做岗位定向微调")

    return ResumeDiagnosisResult(
        version=PROMPT_VERSION,
        generatedAt=generated_at,
        overallScore=overall_score,
        summary="，".join(summary_parts) + "。",
        quality=quality,
        alignment=alignment,
        actionPlan=action_plan,
    )


def _normalize_result(data: ResumeDiagnosisResult) -> ResumeDiagnosisResult:
    generated_at = data.generatedAt or datetime.now(timezone.utc).isoformat()
    return ResumeDiagnosisResult(
        version=data.version or PROMPT_VERSION,
        generatedAt=generated_at,
        overallScore=data.overallScore,
        summary=data.summary,
        quality=data.quality,
        alignment=data.alignment,
        actionPlan=data.actionPlan,
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


async def run_resume_diagnosis_pipeline(
    payload: ResumeDiagnosisRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[ResumeDiagnosisResult]:
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
                    model=runtime.settings.openai_model_resume_diagnosis,
                    system_prompt=prompt,
                    input_payload=payload.model_dump(),
                    response_model=ResumeDiagnosisResult,
                    request_id=context.request_id,
                    user_id=context.user_id,
                    metadata={"promptVersion": PROMPT_VERSION},
                )
            )
            data = _normalize_result(ResumeDiagnosisResult.model_validate(provider_response.data))
            provider_name = provider_response.provider
            model_name = provider_response.model
            token_usage = provider_response.token_usage
        except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
            fallback_used = True
            error_payload = _build_error_payload(error)
            data = _build_rule_based_result(payload)
            logger.info("Resume diagnosis pipeline fell back to rule-based mode", extra=error_payload)

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
                capability="resume_diagnosis",
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
                capability="resume_diagnosis",
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
