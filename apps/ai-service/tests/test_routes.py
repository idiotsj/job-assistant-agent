from fastapi.testclient import TestClient

from app.dependencies import AiServiceRuntime
from app.main import create_app
from app.schemas.daily_advice import DailyAdviceResult
from app.schemas.job_resume_analysis import JobResumeAnalysisResult
from app.schemas.job_resume_rewrite import JobResumeRewriteSuggestionsResult
from app.pipelines.job_scoring import JobScoreEnhancementResponse
from app.providers import StructuredProviderRequest, StructuredProviderResponse
from app.repositories import InMemoryAiRunLogRepository
from app.schemas.resume import ResumeParseResponseData
from app.schemas.resume_diagnosis import ResumeDiagnosisResult
from app.core.config import Settings

INTERNAL_TOKEN = "test-internal-token"


class FakeProvider:
    def __init__(self, responses: dict[str, object]):
        self.responses = responses

    async def generate_structured(self, request: StructuredProviderRequest) -> StructuredProviderResponse:
        data = self.responses[request.capability]
        return StructuredProviderResponse(
            data=data,
            provider="openai",
            model=request.model,
            token_usage={"total_tokens": 42},
        )


def build_test_client() -> tuple[TestClient, InMemoryAiRunLogRepository]:
    repository = InMemoryAiRunLogRepository(log_mode="full")
    runtime = AiServiceRuntime(
        settings=Settings(
            service_name="job-assistant-ai-test",
            environment="test",
            database_url=None,
            ai_log_mode="full",
            internal_service_token=INTERNAL_TOKEN,
            openai_api_key="test-key",
            openai_base_url="https://example.com/v1",
            openai_model_resume_parse="gpt-test",
            openai_model_resume_diagnosis="gpt-test",
            openai_model_job_resume_analysis="gpt-test",
            openai_model_job_resume_rewrite="gpt-test",
            openai_model_job_scoring="gpt-test",
            openai_model_daily_advice="gpt-test",
        ),
        provider=FakeProvider(
            {
                "resume_parse": ResumeParseResponseData.model_validate(
                    {
                        "parsed": {
                            "summary": "识别到前端求职倾向",
                            "detectedSkills": ["Python", "React"],
                            "detectedJobTypes": ["前端开发"],
                            "detectedCities": ["上海"],
                            "education": {
                                "university": "同济大学",
                                "major": "计算机科学",
                            },
                            "confidence": 0.93,
                        },
                        "patch": {
                            "university": "同济大学",
                            "major": "计算机科学",
                            "skills": ["Python", "React"],
                            "preferredJobTypes": ["前端开发"],
                            "targetCities": ["上海"],
                        },
                    }
                ),
                "job_scoring": JobScoreEnhancementResponse.model_validate(
                    {
                        "items": [
                            {
                                "jobId": "job-1",
                                "scoreDelta": 12,
                                "reason": "项目经历和岗位方向更贴合",
                                "signals": ["project_relevance"],
                            }
                        ]
                    }
                ),
                "resume_diagnosis": ResumeDiagnosisResult.model_validate(
                    {
                        "version": "v1",
                        "generatedAt": "2026-04-13T11:00:00.000Z",
                        "overallScore": 85,
                        "summary": "简历基础不错，优先补量化成果和项目证据。",
                        "quality": {
                            "strengths": ["技能关键词比较集中。"],
                            "risks": ["缺少量化结果。"],
                            "missingInfo": ["项目经历"],
                        },
                        "alignment": {
                            "targetSummary": "目标岗位偏向 前端开发；优先城市是 上海",
                            "matchedSignals": ["简历表达出的岗位方向与画像目标有交集：前端开发。"],
                            "gapSignals": [],
                        },
                        "actionPlan": {
                            "topPriority": "先补一段能证明前端方向的项目成果。",
                            "nextSteps": ["给项目补充量化结果。", "把关键词提前。"],
                        },
                    }
                ),
                "job_resume_analysis": JobResumeAnalysisResult.model_validate(
                    {
                        "version": "v1",
                        "generatedAt": "2026-04-16T13:00:00.000Z",
                        "overallScore": 78,
                        "verdict": "partial_match",
                        "summary": "简历和岗位有交集，但还需要补强 TypeScript 证据。",
                        "matchedRequirements": ["岗位强调 React，你的简历里已经有对应技能信号。"],
                        "gaps": ["岗位强调 TypeScript，但简历里还缺少直接证据。"],
                        "resumeRisks": ["缺少量化结果或明确成果指标，竞争力容易被低估。"],
                        "actionPlan": {
                            "topPriority": "先补能证明 TypeScript 的项目、课程或实习证据。",
                            "nextSteps": [
                                "补一段能支撑 TypeScript 的经历，并写清任务、动作和结果。",
                                "给最关键的一段项目补 1 到 2 个量化结果。",
                            ],
                        },
                    }
                ),
                "job_resume_rewrite": JobResumeRewriteSuggestionsResult.model_validate(
                    {
                        "version": "v1",
                        "generatedAt": "2026-04-17T13:00:00.000Z",
                        "summary": "建议优先改写简历开头、技能区和最贴近岗位的一段项目经历。",
                        "headlineSuggestion": "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
                        "summarySuggestion": "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
                        "keywordSuggestions": ["前端开发", "React", "TypeScript"],
                        "sectionSuggestions": [
                            {
                                "section": "headline",
                                "currentIssue": "当前简历抬头不够贴近目标岗位。",
                                "rewriteGoal": "让招聘方一眼看到投递方向。",
                                "suggestedText": "前端开发候选人 | 上海 | React 项目经验与岗位关键词对齐",
                            },
                            {
                                "section": "summary",
                                "currentIssue": "缺少岗位定向摘要。",
                                "rewriteGoal": "在开头快速说明能力与目标岗位的关联。",
                                "suggestedText": "聚焦前端开发方向，已具备 React 等基础能力，希望在上海参与互联网业务场景下的页面与功能建设。",
                            },
                        ],
                        "actionChecklist": [
                            "把岗位关键词提前到简历开头和技能区。",
                            "优先改写最贴近目标岗位的一段项目经历。",
                        ],
                    }
                ),
                "daily_advice": DailyAdviceResult.model_validate(
                    {
                        "title": "今天先处理最匹配的岗位",
                        "body": "先投递高匹配职位，再整理一条最能体现优势的项目经历。",
                        "source": "ai",
                    }
                ),
            }
        ),
        ai_run_logs=repository,
    )
    return TestClient(create_app(runtime)), repository


def build_test_client_without_token() -> TestClient:
    runtime = AiServiceRuntime(
        settings=Settings(
            service_name="job-assistant-ai-test",
            environment="test",
            database_url=None,
            ai_log_mode="full",
            internal_service_token=None,
            openai_api_key="test-key",
            openai_base_url="https://example.com/v1",
            openai_model_resume_parse="gpt-test",
            openai_model_resume_diagnosis="gpt-test",
            openai_model_job_resume_analysis="gpt-test",
            openai_model_job_resume_rewrite="gpt-test",
            openai_model_job_scoring="gpt-test",
            openai_model_daily_advice="gpt-test",
        ),
        provider=FakeProvider({}),
        ai_run_logs=InMemoryAiRunLogRepository(log_mode="full"),
    )
    return TestClient(create_app(runtime))


def test_health() -> None:
    client, _repository = build_test_client()
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ok"


def test_resume_parse_route_returns_meta_and_writes_log() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/resume/parse",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-1",
            "x-ai-user-id": "user-1",
        },
        json={
            "rawText": "同济大学计算机科学专业，熟悉 Python、TypeScript、React，希望在上海从事前端开发。",
            "fileName": "resume.txt",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["parsed"]["education"]["university"] == "同济大学"
    assert payload["meta"]["provider"] == "openai"
    assert payload["meta"]["fallbackUsed"] is False
    assert repository.entries[-1].request_id == "req-route-1"
    assert repository.entries[-1].user_id == "user-1"


def test_score_jobs_route_returns_ranked_items_with_meta() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/recommend/score-jobs",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-2",
            "x-ai-user-id": "user-2",
        },
        json={
            "profile": {
                "userId": "user-2",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["TypeScript", "React"],
                "preferredJobTypes": ["前端开发"],
            },
            "jobs": [
                {
                    "id": "job-1",
                    "title": "前端开发实习生",
                    "companyId": "company-1",
                    "companyName": "星河科技",
                    "companyIndustry": "互联网",
                    "workLocation": "上海",
                    "tags": ["前端", "实习"],
                    "requiredSkills": ["TypeScript", "React"],
                    "description": "负责页面开发。",
                    "isFeatured": True,
                    "deadline": "2026-04-20T00:00:00.000Z",
                    "publishedAt": "2026-04-10T00:00:00.000Z",
                    "popularity": 90,
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["items"][0]["jobId"] == "job-1"
    assert payload["data"]["items"][0]["score"] > 0
    assert payload["meta"]["provider"] == "openai"
    assert repository.entries[-1].request_id == "req-route-2"


def test_resume_diagnose_route_returns_structured_diagnosis_with_meta() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/resume/diagnose",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-4",
            "x-ai-user-id": "user-4",
        },
        json={
            "rawText": "同济大学计算机科学专业，熟悉 Python、React，希望在上海从事前端开发。",
            "parsedResume": {
                "summary": "识别到前端求职倾向",
                "detectedSkills": ["Python", "React"],
                "detectedJobTypes": ["前端开发"],
                "detectedCities": ["上海"],
                "education": {
                    "university": "同济大学",
                    "major": "计算机科学",
                },
                "confidence": 0.9,
            },
            "profile": {
                "userId": "user-4",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["Python", "React"],
                "preferredJobTypes": ["前端开发"],
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["overallScore"] == 85
    assert payload["data"]["actionPlan"]["topPriority"].startswith("先补一段")
    assert payload["meta"]["provider"] == "openai"
    assert repository.entries[-1].capability == "resume_diagnosis"
    assert repository.entries[-1].request_id == "req-route-4"


def test_job_resume_analysis_route_returns_structured_analysis_with_meta() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/resume/analyze-for-job",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-5",
            "x-ai-user-id": "user-5",
        },
        json={
            "rawText": "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
            "parsedResume": {
                "summary": "识别到前端求职倾向",
                "detectedSkills": ["React"],
                "detectedJobTypes": ["前端开发"],
                "detectedCities": ["上海"],
                "education": {
                    "university": "同济大学",
                    "major": "计算机科学",
                },
                "confidence": 0.88,
            },
            "profile": {
                "userId": "user-5",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["React"],
                "preferredJobTypes": ["前端开发"],
            },
            "job": {
                "id": "job-1",
                "title": "前端开发实习生",
                "companyId": "company-1",
                "companyName": "星河科技",
                "companyIndustry": "互联网",
                "workLocation": "上海",
                "tags": ["前端"],
                "requiredSkills": ["React", "TypeScript"],
                "description": "负责页面开发。",
                "isFeatured": True,
                "deadline": "2026-04-20T00:00:00.000Z",
                "publishedAt": "2026-04-10T00:00:00.000Z",
                "popularity": 90,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["verdict"] == "partial_match"
    assert payload["meta"]["provider"] == "openai"
    assert repository.entries[-1].capability == "job_resume_analysis"
    assert repository.entries[-1].request_id == "req-route-5"


def test_job_resume_rewrite_route_returns_structured_suggestions_with_meta() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/resume/suggest-rewrite-for-job",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-6",
            "x-ai-user-id": "user-6",
        },
        json={
            "rawText": "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
            "parsedResume": {
                "summary": "识别到前端求职倾向",
                "detectedSkills": ["React"],
                "detectedJobTypes": ["前端开发"],
                "detectedCities": ["上海"],
                "education": {
                    "university": "同济大学",
                    "major": "计算机科学",
                },
                "confidence": 0.88,
            },
            "profile": {
                "userId": "user-6",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["React"],
                "preferredJobTypes": ["前端开发"],
            },
            "job": {
                "id": "job-1",
                "title": "前端开发实习生",
                "companyId": "company-1",
                "companyName": "星河科技",
                "companyIndustry": "互联网",
                "workLocation": "上海",
                "tags": ["前端"],
                "requiredSkills": ["React", "TypeScript"],
                "description": "负责页面开发。",
                "isFeatured": True,
                "deadline": "2026-04-20T00:00:00.000Z",
                "publishedAt": "2026-04-10T00:00:00.000Z",
                "popularity": 90,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["keywordSuggestions"] == ["前端开发", "React", "TypeScript"]
    assert payload["meta"]["provider"] == "openai"
    assert repository.entries[-1].capability == "job_resume_rewrite"
    assert repository.entries[-1].request_id == "req-route-6"


def test_daily_advice_route_returns_generated_advice_with_meta() -> None:
    client, repository = build_test_client()
    response = client.post(
        "/internal/daily/advice",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
            "x-request-id": "req-route-3",
            "x-ai-user-id": "user-3",
        },
        json={
            "profile": {
                "userId": "user-3",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["React"],
                "preferredJobTypes": ["前端开发"],
            },
            "curatedAdvice": {
                "title": "先完善画像",
                "body": "补全目标城市和技能标签。",
            },
            "featuredCompany": {
                "id": "company-1",
                "name": "星河科技",
                "industry": "互联网",
                "city": "上海",
                "description": "校园招聘平台",
                "isFeatured": True,
            },
            "featuredJobs": [],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["source"] == "ai"
    assert payload["meta"]["provider"] == "openai"
    assert repository.entries[-1].request_id == "req-route-3"


def test_internal_routes_reject_requests_without_service_token() -> None:
    client, _repository = build_test_client()
    response = client.post(
        "/internal/resume/parse",
        json={
            "rawText": "同济大学计算机科学专业，熟悉 Python。",
        },
    )

    assert response.status_code == 401


def test_internal_routes_fail_closed_when_service_token_is_not_configured() -> None:
    client = build_test_client_without_token()
    response = client.post(
        "/internal/resume/parse",
        headers={
            "x-internal-service-token": INTERNAL_TOKEN,
        },
        json={
            "rawText": "同济大学计算机科学专业，熟悉 Python。",
        },
    )

    assert response.status_code == 503
