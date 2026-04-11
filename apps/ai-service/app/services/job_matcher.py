from datetime import datetime, timezone

from app.schemas.recommendation import (
    JobPayload,
    JobScoreItem,
    JobScoringRequest,
    JobScoringResponse,
    JobScoringResponseData,
    ProfilePayload,
)


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


def _build_reason(signals: list[str]) -> str:
    if signals:
        return "，".join(signals)
    return "Python 增强推荐"


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
        reason=_build_reason(reasons),
        signals=signals,
    )


def score_jobs(payload: JobScoringRequest) -> JobScoringResponse:
    now = datetime.now(timezone.utc)
    items = [_score_single_job(job, payload.profile, now) for job in payload.jobs]
    ranked = sorted(items, key=lambda item: item.score, reverse=True)
    return JobScoringResponse(
        data=JobScoringResponseData(items=ranked),
    )
