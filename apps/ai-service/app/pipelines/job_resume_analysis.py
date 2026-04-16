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
from app.schemas.job_resume_analysis import (
    JobResumeAnalysisActionPlan,
    JobResumeAnalysisRequest,
    JobResumeAnalysisResult,
)
from app.schemas.recommendation import ProfilePayload


logger = get_logger("pipelines.job_resume_analysis")

PIPELINE_NAME = "job_resume_analysis"
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


def _normalize_tokens(values: list[str]) -> set[str]:
    return {value.strip().lower() for value in values if value and value.strip()}


def _profile_or_default(profile: ProfilePayload | None) -> ProfilePayload:
    return profile or ProfilePayload()


def _contains_keyword(text: str, keyword: str) -> bool:
    keyword = keyword.strip().lower()
    if not keyword:
        return False
    lowered_text = text.lower()
    return keyword in lowered_text


def _resume_skill_matches(payload: JobResumeAnalysisRequest) -> tuple[list[str], list[str]]:
    required_skills = _merge_unique(payload.job.requiredSkills)
    resume_skills = _normalize_tokens(
        [*payload.parsedResume.detectedSkills, *(payload.profile.skills if payload.profile else [])]
    )
    matched: list[str] = []
    missing: list[str] = []

    for skill in required_skills:
        if skill.lower() in resume_skills:
            matched.append(skill)
        else:
            missing.append(skill)

    return matched, missing


def _job_direction_matches(payload: JobResumeAnalysisRequest) -> tuple[list[str], list[str]]:
    job_text = " ".join([payload.job.title, *payload.job.tags]).strip()
    resume_targets = _merge_unique(
        [
            *payload.parsedResume.detectedJobTypes,
            *((payload.profile.preferredJobTypes if payload.profile else []) or []),
        ]
    )
    matched: list[str] = []
    missing: list[str] = []

    for target in resume_targets:
        if _contains_keyword(job_text, target):
            matched.append(target)

    if resume_targets and not matched:
        missing.append("简历当前表达的岗位方向和这份 JD 还没有明显对齐。")
    elif not resume_targets:
        missing.append("简历里缺少明确的目标岗位表达，难以支撑定向投递。")

    return _merge_unique(matched), _merge_unique(missing)


def _build_matched_requirements(
    payload: JobResumeAnalysisRequest,
    profile: ProfilePayload,
    matched_skills: list[str],
    matched_job_types: list[str],
) -> list[str]:
    matched: list[str] = []

    for skill in matched_skills[:4]:
        matched.append(f"岗位强调 {skill}，你的简历里已经有对应技能信号。")

    if matched_job_types:
        matched.append(f"简历表达的岗位方向与当前 JD 有交集：{'、'.join(matched_job_types[:2])}。")

    if payload.job.workLocation and payload.job.workLocation in profile.targetCities:
        matched.append(f"岗位地点 {payload.job.workLocation} 与当前画像目标城市一致。")

    if payload.job.companyIndustry and payload.job.companyIndustry in profile.targetIndustries:
        matched.append(f"岗位所属行业 {payload.job.companyIndustry} 与当前画像目标一致。")

    if payload.job.isFeatured:
        matched.append("这是一条精选岗位，值得优先准备定向投递材料。")

    return _merge_unique(matched)[:5]


def _build_gaps(
    payload: JobResumeAnalysisRequest,
    profile: ProfilePayload,
    missing_skills: list[str],
    direction_gaps: list[str],
) -> list[str]:
    gaps: list[str] = []

    for skill in missing_skills[:4]:
        gaps.append(f"岗位强调 {skill}，但简历里还缺少直接证据。")

    gaps.extend(direction_gaps[:2])

    if profile.targetCities and payload.job.workLocation not in profile.targetCities:
        gaps.append(f"当前画像优先城市不是 {payload.job.workLocation}，投递前要确认城市意愿。")

    if profile.targetIndustries and payload.job.companyIndustry not in profile.targetIndustries:
        gaps.append(f"当前画像目标行业与岗位所在行业 {payload.job.companyIndustry} 不完全一致。")

    return _merge_unique(gaps)[:5]


def _build_resume_risks(payload: JobResumeAnalysisRequest) -> list[str]:
    raw_text = payload.rawText.strip()
    lowered = raw_text.lower()
    risks: list[str] = []

    if len(raw_text) < 220:
        risks.append("简历内容偏短，支撑岗位匹配度的证据可能不够。")

    if not re.search(r"\d", raw_text):
        risks.append("缺少量化结果或明确成果指标，竞争力容易被低估。")

    if "项目" not in raw_text and "project" not in lowered:
        risks.append("缺少项目经历或项目证据，难以证明岗位相关能力。")

    if "实习" not in raw_text and "intern" not in lowered:
        risks.append("相关实习或实践经历没有被明确写出来，容易显得证据不足。")

    if not payload.parsedResume.detectedJobTypes:
        risks.append("简历没有明确目标岗位表达，HR 很难快速判断投递意图。")

    return _merge_unique(risks)[:5]


def _build_action_plan(
    missing_skills: list[str],
    gaps: list[str],
    resume_risks: list[str],
) -> JobResumeAnalysisActionPlan:
    if missing_skills:
        top_priority = f"先补能证明 {missing_skills[0]} 的项目、课程或实习证据。"
    elif gaps:
        top_priority = gaps[0]
    elif resume_risks:
        top_priority = resume_risks[0]
    else:
        top_priority = "按这份 JD 微调关键词和经历顺序后再投递。"

    next_steps: list[str] = []
    for skill in missing_skills[:2]:
        next_steps.append(f"补一段能支撑 {skill} 的经历，并写清任务、动作和结果。")

    if any("岗位方向" in gap or "目标岗位" in gap for gap in gaps + resume_risks):
        next_steps.append("把目标岗位方向写到简历开头或最近经历附近，避免投递意图模糊。")

    if any("量化" in risk or "成果" in risk for risk in resume_risks):
        next_steps.append("给最关键的一段项目或实习补 1 到 2 个量化结果。")

    if any("项目经历" in risk or "项目证据" in risk for risk in resume_risks):
        next_steps.append("补一段最贴近当前 JD 的项目经历，并突出使用到的技能。")

    if any("实习" in risk or "实践" in risk for risk in resume_risks):
        next_steps.append("如果有相关实践，请拆成单独经历，避免简历显得只有课程背景。")

    if any("城市" in gap for gap in gaps):
        next_steps.append("在投递说明或简历补充信息里明确你的到岗城市意向。")

    fallback_steps = [
        "对照 JD 重新排序技能和项目，把最贴近岗位的内容放到前半屏。",
        "把岗位关键词自然写进经历标题和要点里，提升首轮筛选命中率。",
    ]
    merged_steps = _merge_unique(next_steps)
    if len(merged_steps) < 2:
        merged_steps = _merge_unique([*merged_steps, *fallback_steps])

    return JobResumeAnalysisActionPlan(
        topPriority=top_priority,
        nextSteps=merged_steps[:4],
    )


def _compute_overall_score(
    matched_skills: list[str],
    missing_skills: list[str],
    matched_requirements: list[str],
    gaps: list[str],
    resume_risks: list[str],
) -> int:
    score = 42
    score += min(len(matched_skills) * 12, 36)
    score += min(len(matched_requirements) * 6, 18)
    score -= min(len(missing_skills) * 9, 27)
    score -= min(len(gaps) * 6, 18)
    score -= min(len(resume_risks) * 5, 20)
    return max(0, min(100, score))


def _build_verdict(overall_score: int, matched_requirements: list[str], gaps: list[str]) -> str:
    if overall_score >= 75 and len(matched_requirements) >= len(gaps):
        return "strong_match"
    if overall_score >= 50:
        return "partial_match"
    return "weak_match"


def _build_summary(verdict: str, matched_requirements: list[str], gaps: list[str], resume_risks: list[str]) -> str:
    if verdict == "strong_match":
        if gaps:
            return f"这份简历和岗位整体匹配度较高，投递前优先补强：{gaps[0]}"
        return "这份简历已经比较接近岗位要求，可以直接做小幅定向微调后投递。"

    if verdict == "partial_match":
        first_gap = gaps[0] if gaps else "先补齐最关键的岗位证据"
        return f"这份简历和岗位有明显交集，但还需要先补强几个关键缺口：{first_gap}"

    if resume_risks:
        return f"当前简历对这份岗位的支撑不足，最先要解决的问题是：{resume_risks[0]}"
    return "当前简历对这份岗位的支撑不足，不建议直接投递。"


def _build_rule_based_result(payload: JobResumeAnalysisRequest) -> JobResumeAnalysisResult:
    profile = _profile_or_default(payload.profile)
    matched_skills, missing_skills = _resume_skill_matches(payload)
    matched_job_types, direction_gaps = _job_direction_matches(payload)
    matched_requirements = _build_matched_requirements(payload, profile, matched_skills, matched_job_types)
    gaps = _build_gaps(payload, profile, missing_skills, direction_gaps)
    resume_risks = _build_resume_risks(payload)
    action_plan = _build_action_plan(missing_skills, gaps, resume_risks)
    overall_score = _compute_overall_score(
        matched_skills,
        missing_skills,
        matched_requirements,
        gaps,
        resume_risks,
    )
    verdict = _build_verdict(overall_score, matched_requirements, gaps)

    return JobResumeAnalysisResult(
        version=PROMPT_VERSION,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        overallScore=overall_score,
        verdict=verdict,
        summary=_build_summary(verdict, matched_requirements, gaps, resume_risks),
        matchedRequirements=matched_requirements,
        gaps=gaps,
        resumeRisks=resume_risks,
        actionPlan=action_plan,
    )


def _normalize_result(data: JobResumeAnalysisResult) -> JobResumeAnalysisResult:
    generated_at = data.generatedAt or datetime.now(timezone.utc).isoformat()
    next_steps = _merge_unique(data.actionPlan.nextSteps)
    if len(next_steps) < 2:
        next_steps = _merge_unique(
            [
                *next_steps,
                "对照 JD 把最贴近岗位的经历提前，并补上关键证据。",
                "把岗位关键词写进最核心的一段经历，提升筛选命中率。",
            ]
        )

    return JobResumeAnalysisResult(
        version=data.version or PROMPT_VERSION,
        generatedAt=generated_at,
        overallScore=data.overallScore,
        verdict=data.verdict,
        summary=data.summary,
        matchedRequirements=_merge_unique(data.matchedRequirements)[:5],
        gaps=_merge_unique(data.gaps)[:5],
        resumeRisks=_merge_unique(data.resumeRisks)[:5],
        actionPlan=JobResumeAnalysisActionPlan(
            topPriority=data.actionPlan.topPriority,
            nextSteps=next_steps[:4],
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


async def run_job_resume_analysis_pipeline(
    payload: JobResumeAnalysisRequest,
    runtime: AiServiceRuntime,
    context: PipelineContext,
) -> PipelineResult[JobResumeAnalysisResult]:
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
                    model=runtime.settings.openai_model_job_resume_analysis,
                    system_prompt=prompt,
                    input_payload=payload.model_dump(),
                    response_model=JobResumeAnalysisResult,
                    request_id=context.request_id,
                    user_id=context.user_id,
                    metadata={"promptVersion": PROMPT_VERSION},
                )
            )
            data = _normalize_result(JobResumeAnalysisResult.model_validate(provider_response.data))
            provider_name = provider_response.provider
            model_name = provider_response.model
            token_usage = provider_response.token_usage
        except (ProviderNotConfiguredError, ProviderExecutionError, ValueError) as error:
            fallback_used = True
            error_payload = _build_error_payload(error)
            data = _build_rule_based_result(payload)
            logger.info("Job resume analysis pipeline fell back to rule-based mode", extra=error_payload)

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
                capability="job_resume_analysis",
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
                capability="job_resume_analysis",
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
