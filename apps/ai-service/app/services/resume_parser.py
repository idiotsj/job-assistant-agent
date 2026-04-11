from app.schemas.resume import (
    ResumeEducation,
    ResumeParseRequest,
    ResumeParseResponse,
    ResumeParseResult,
)


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


def parse_resume(payload: ResumeParseRequest) -> ResumeParseResponse:
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

    return ResumeParseResponse(
        data=ResumeParseResult(
            summary=summary,
            detectedSkills=detected_skills,
            detectedJobTypes=detected_job_types,
            detectedCities=detected_cities,
            education=ResumeEducation(
                university=universities[0] if universities else None,
                major=majors[0] if majors else None,
            ),
            confidence=round(confidence, 2),
        )
    )
