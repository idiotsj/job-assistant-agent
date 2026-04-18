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
from app.schemas.job_resume_rewrite import (
    JobResumeRewriteRequest,
    JobResumeRewriteResponse,
    JobResumeRewriteSectionSuggestion,
    JobResumeRewriteSuggestionsResult,
)
from app.schemas.recommendation import ProfilePayload


logger = get_logger("pipelines.job_resume_rewrite")

PIPELINE_NAME = "job_resume_rewrite"
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


def _profile_or_default(profile: ProfilePayload | None) -> ProfilePayload:
    return profile or ProfilePayload()


def _normalize_tokens(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _job_keywords(payload: JobResumeRewriteRequest) -> list[str]:
    job_keywords = _merge_unique([payload.job.title, *payload.job.tags, *payload.job.requiredSkills])
    return job_keywords[:8]


def _build_keyword_suggestions(payload: JobResumeRewriteRequest, profile: ProfilePayload) -> list[str]:
    keyword_suggestions = _merge_unique(
        [
            *_job_keywords(payload),
            *payload.parsedResume.detectedJobTypes,
            *payload.parsedResume.detectedSkills,
            payload.job.companyIndustry,
            payload.job.workLocation,
            *profile.preferredJobTypes,
            *profile.skills,
            *profile.targetIndustries,
            *profile.targetCities,
            "项目经历",
            "量化结果",
            "岗位关键词",
        ]
    )
    return keyword_suggestions[:8]


def _missing_skills(payload: JobResumeRewriteRequest) -> list[str]:
    known_skills = _normalize_tokens(
        [*payload.parsedResume.detectedSkills, *((payload.profile.skills if payload.profile else []) or [])]
    )
    missing: list[str] = []
    for skill in payload.job.requiredSkills:
        if skill.strip() and skill.strip().lower() not in known_skills:
            missing.append(skill)
    return _merge_unique(missing)


def _build_headline(payload: JobResumeRewriteRequest) -> str:
    city = payload.job.workLocation.strip() if payload.job.workLocation.strip() else "目标城市"
    return f"{payload.job.title} 候选人 | {city} | 校园项目与岗位关键词对齐"


def _build_summary_suggestion(payload: JobResumeRewriteRequest, profile: ProfilePayload, missing_skills: list[str]) -> str:
    strengths = _merge_unique([*payload.parsedResume.detectedSkills, *profile.skills])[:3]
    strengths_text = "、".join(strengths) if strengths else "相关项目与实践"
    missing_text = f"，当前正补强 {missing_skills[0]} 相关证据" if missing_skills else ""
    work_location = payload.job.workLocation.strip() or (profile.targetCities[0] if profile.targetCities else "目标城市")
    industry = payload.job.companyIndustry.strip() or (
        profile.targetIndustries[0] if profile.targetIndustries else "目标业务场景"
    )
    return (
        f"聚焦 {payload.job.title} 方向，已具备 {strengths_text} 等基础能力，"
        f"希望在 {work_location} 参与 {industry} 场景中的实际业务问题解决{missing_text}。"
    )


def _build_section_suggestions(
    payload: JobResumeRewriteRequest,
    profile: ProfilePayload,
    missing_skills: list[str],
) -> list[JobResumeRewriteSectionSuggestion]:
    suggestions: list[JobResumeRewriteSectionSuggestion] = [
        JobResumeRewriteSectionSuggestion(
            section="headline",
            currentIssue="当前简历抬头或开头没有明显贴近目标岗位。",
            rewriteGoal="让招聘方在最前面就看到你的投递方向和场景匹配度。",
            suggestedText=_build_headline(payload),
        ),
        JobResumeRewriteSectionSuggestion(
            section="summary",
            currentIssue="简历开头缺少面向这份 JD 的定向概述。",
            rewriteGoal="在 2 到 3 句话内说明你的岗位方向、核心能力和目标场景。",
            suggestedText=_build_summary_suggestion(payload, profile, missing_skills),
        ),
    ]

    keyword_text = "、".join(_job_keywords(payload)[:5])
    suggestions.append(
        JobResumeRewriteSectionSuggestion(
            section="skills",
            currentIssue="技能区还没有按照目标岗位的筛选顺序重排。",
            rewriteGoal="把和 JD 最相关的技能放在前面，提升首轮关键词命中率。",
            suggestedText=f"技能建议优先排为：{keyword_text}。",
        )
    )

    if missing_skills:
        suggestions.append(
            JobResumeRewriteSectionSuggestion(
                section="project",
                currentIssue=f"简历里缺少能直接证明 {missing_skills[0]} 的项目或经历表述。",
                rewriteGoal="补一段能把岗位要求和你的真实动作连接起来的项目要点。",
                suggestedText=(
                    f"建议补一句类似：围绕 {missing_skills[0]} 相关任务完成页面/功能实现，"
                    "通过拆解需求、落地实现和结果复盘展示岗位契合度。"
                ),
            )
        )
    else:
        suggestions.append(
            JobResumeRewriteSectionSuggestion(
                section="experience",
                currentIssue="已有经历和岗位是相关的，但还没有足够突出业务结果。",
                rewriteGoal="把最贴近岗位的经历改成“动作 + 场景 + 结果”的表达。",
                suggestedText="把最相关经历改写成一条结果导向描述，突出你解决了什么问题、如何做、产出了什么结果。",
            )
        )

    return suggestions[:5]


def _build_action_checklist(payload: JobResumeRewriteRequest, missing_skills: list[str]) -> list[str]:
    actions: list[str] = []
    if missing_skills:
        actions.append(f"先补一条能证明 {missing_skills[0]} 的项目或实践表述。")

    if not re.search(r"\d", payload.rawText):
        actions.append("给最关键的一段经历补 1 到 2 个量化结果。")

    actions.append("把目标岗位关键词前置到简历开头、技能区和最相关经历里。")
    actions.append("优先把最贴近 JD 的项目或实习排到前半屏。")

    return _merge_unique(actions)[:4]


def _build_rule_based_result(payload: JobResumeRewriteRequest) -> JobResumeRewriteSuggestionsResult:
    profile = _profile_or_default(payload.profile)
    missing_skills = _missing_skills(payload)
    generated_at = datetime.now(timezone.utc).isoformat()
    section_suggestions = _build_section_suggestions(payload, profile, missing_skills)
    action_checklist = _build_action_checklist(payload, missing_skills)
    keyword_suggestions = _build_keyword_suggestions(payload, profile)

    return JobResumeRewriteSuggestionsResult(
        version=PROMPT_VERSION,
        generatedAt=generated_at,
        summary="这份建议会优先帮你把简历改成更贴近目标岗位筛选逻辑的表达，而不是重写整份简历。",
        headlineSuggestion=_build_headline(payload),
        summarySuggestion=_build_summary_suggestion(payload, profile, missing_skills),
        keywordSuggestions=keyword_suggestions[:8],
        sectionSuggestions=section_suggestions[:5],
        actionChecklist=action_checklist[:4],
    )


def _normalize_result(data: JobResumeRewriteSuggestionsResult) -> JobResumeRewriteSuggestionsResult:
    generated_at = data.generatedAt or datetime.now(timezone.utc).isoformat()
    keyword_suggestions = _merge_unique(data.keywordSuggestions)
    if len(keyword_suggestions) < 3:
        keyword_suggestions = _merge_unique([*keyword_suggestions, "项目经历", "量化结果", "岗位关键词"])

    section_suggestions = data.sectionSuggestions[:5]
    if len(section_suggestions) < 2:
        section_suggestions = [
            *section_suggestions,
            JobResumeRewriteSectionSuggestion(
                section="summary",
                currentIssue="当前建议过于简略。",
                rewriteGoal="至少给出一个摘要层的改写方向。",
                suggestedText=data.summarySuggestion or "先补一段和目标岗位强相关的摘要说明。",
            ),
            JobResumeRewriteSectionSuggestion(
                section="experience",
                currentIssue="当前建议还没有覆盖经历部分。",
                rewriteGoal="给出一条最关键经历的改写方向。",
                suggestedText="把最贴近岗位的一段经历改写成动作、场景和结果都清楚的一条描述。",
            ),
        ][:2]

    action_checklist = _merge_unique(data.actionChecklist)
    if len(action_checklist) < 2:
        action_checklist = _merge_unique(
            [
                *action_checklist,
                "把岗位关键词提前到简历开头和最相关经历里。",
                "优先改写最贴近目标岗位的一段项目或实习经历。",
            ]
        )

    return JobResumeRewriteSuggestionsResult(
        version=data.version or PROMPT_VERSION,
        generatedAt=generated_at,
        summary=data.summary,
        headlineSuggestion=data.headlineSuggestion,
        summarySuggestion=data.summarySuggestion,
        keywordSuggestions=keyword_suggestions[:8],
        sectionSuggestions=section_suggestions[:5],
        actionChecklist=action_checklist[:4],
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


async def run_job_resume_rewrite_pipeline(
    payload: JobResumeRewriteRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[JobResumeRewriteSuggestionsResult]:
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
                    model=runtime.settings.openai_model_job_resume_rewrite,
                    system_prompt=prompt,
                    input_payload=payload.model_dump(),
                    response_model=JobResumeRewriteSuggestionsResult,
                    request_id=context.request_id,
                    user_id=context.user_id,
                    metadata={"promptVersion": PROMPT_VERSION},
                )
            )
            data = _normalize_result(JobResumeRewriteSuggestionsResult.model_validate(provider_response.data))
            provider_name = provider_response.provider
            model_name = provider_response.model
            token_usage = provider_response.token_usage
        except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
            fallback_used = True
            error_payload = _build_error_payload(error)
            data = _build_rule_based_result(payload)
            logger.info("Job resume rewrite pipeline fell back to rule-based mode", extra=error_payload)

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
                capability="job_resume_rewrite",
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
                capability="job_resume_rewrite",
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
