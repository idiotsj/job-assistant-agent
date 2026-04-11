import asyncio

from app.core.config import Settings
from app.dependencies import AiServiceRuntime
from app.pipelines import PipelineContext
from app.pipelines.daily_advice import run_daily_advice_pipeline
from app.pipelines.job_scoring import JobScoreEnhancementResponse, run_job_scoring_pipeline
from app.pipelines.resume_parse import run_resume_parse_pipeline
from app.providers import (
    ProviderExecutionError,
    StructuredProviderRequest,
    StructuredProviderResponse,
)
from app.repositories import InMemoryAiRunLogRepository
from app.schemas.daily_advice import DailyAdviceRequest, DailyAdviceResult
from app.schemas.recommendation import JobScoringRequest
from app.schemas.resume import ResumeParseRequest, ResumeParseResponseData


class SuccessProvider:
    def __init__(self, responses: dict[str, object]):
        self.responses = responses

    async def generate_structured(self, request: StructuredProviderRequest) -> StructuredProviderResponse:
        return StructuredProviderResponse(
            data=self.responses[request.capability],
            provider="openai",
            model=request.model,
            token_usage={"total_tokens": 21},
        )


class FailingProvider:
    async def generate_structured(self, request: StructuredProviderRequest) -> StructuredProviderResponse:
        raise ProviderExecutionError(f"provider failed for {request.capability}")


def build_runtime(
    provider: object,
    repository: InMemoryAiRunLogRepository | None = None,
) -> AiServiceRuntime:
    return AiServiceRuntime(
        settings=Settings(
            service_name="job-assistant-ai-test",
            environment="test",
            database_url=None,
            ai_log_mode="full",
            openai_api_key="test-key",
            openai_base_url="https://example.com/v1",
            openai_model_resume_parse="gpt-test-resume",
            openai_model_job_scoring="gpt-test-jobs",
            openai_model_daily_advice="gpt-test-daily",
        ),
        provider=provider,
        ai_run_logs=repository or InMemoryAiRunLogRepository(log_mode="full"),
    )


def test_resume_parse_pipeline_uses_provider_result_and_logs_full_payload() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="full")
    runtime = build_runtime(
        SuccessProvider(
            {
                "resume_parse": ResumeParseResponseData.model_validate(
                    {
                        "parsed": {
                            "summary": "结构化解析完成",
                            "detectedSkills": ["Python"],
                            "detectedJobTypes": ["前端开发"],
                            "detectedCities": ["上海"],
                            "education": {
                                "university": "同济大学",
                                "major": "计算机科学",
                            },
                            "confidence": 0.91,
                        },
                        "patch": {
                            "skills": ["Python"],
                            "preferredJobTypes": ["前端开发"],
                            "targetCities": ["上海"],
                        },
                    }
                )
            }
        ),
        repository,
    )

    result = asyncio.run(
        run_resume_parse_pipeline(
            ResumeParseRequest(rawText="同济大学计算机科学专业，熟悉 Python，希望在上海从事前端开发。"),
            runtime,
            PipelineContext(request_id="req-pipeline-1", user_id="user-1"),
        )
    )

    assert result.data.parsed.detectedSkills == ["Python"]
    assert result.meta.provider == "openai"
    assert result.meta.fallbackUsed is False
    assert repository.entries[0].input_json["rawText"].startswith("同济大学")
    assert repository.entries[0].request_id == "req-pipeline-1"


def test_resume_parse_pipeline_falls_back_when_provider_fails() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="full")
    runtime = build_runtime(FailingProvider(), repository)

    result = asyncio.run(
        run_resume_parse_pipeline(
            ResumeParseRequest(rawText="同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。"),
            runtime,
            PipelineContext(request_id="req-pipeline-2", user_id="user-2"),
        )
    )

    assert result.meta.provider == "rule-based"
    assert result.meta.fallbackUsed is True
    assert "React" in result.data.parsed.detectedSkills
    assert repository.entries[0].error_json["errorType"] == "ProviderExecutionError"


def test_job_scoring_pipeline_merges_provider_enhancement() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="minimal")
    runtime = build_runtime(
        SuccessProvider(
            {
                "job_scoring": JobScoreEnhancementResponse.model_validate(
                    {
                        "items": [
                            {
                                "jobId": "job-2",
                                "scoreDelta": 15,
                                "reason": "项目经历更相关",
                                "signals": ["project_relevance"],
                            }
                        ]
                    }
                )
            }
        ),
        repository,
    )

    result = asyncio.run(
        run_job_scoring_pipeline(
            JobScoringRequest.model_validate(
                {
                    "profile": {
                        "userId": "user-1",
                        "targetIndustries": ["互联网"],
                        "targetCities": ["上海"],
                        "skills": ["React", "TypeScript"],
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
                            "tags": ["前端"],
                            "requiredSkills": ["React"],
                            "description": "页面开发",
                            "isFeatured": True,
                            "deadline": "2026-04-20T00:00:00.000Z",
                            "publishedAt": "2026-04-10T00:00:00.000Z",
                            "popularity": 80,
                        },
                        {
                            "id": "job-2",
                            "title": "前端开发工程师",
                            "companyId": "company-2",
                            "companyName": "流光互娱",
                            "companyIndustry": "互联网",
                            "workLocation": "上海",
                            "tags": ["前端"],
                            "requiredSkills": ["React", "TypeScript"],
                            "description": "活动页面开发",
                            "isFeatured": False,
                            "deadline": "2026-04-25T00:00:00.000Z",
                            "publishedAt": "2026-04-09T00:00:00.000Z",
                            "popularity": 60,
                        },
                    ],
                }
            ),
            runtime,
            PipelineContext(request_id="req-pipeline-3", user_id="user-3"),
        )
    )

    assert result.meta.provider == "openai"
    assert any(item.jobId == "job-2" and item.reason == "项目经历更相关" for item in result.data.items)
    assert repository.entries[0].input_json["preview"]["jobs"]["type"] == "list"

def test_job_scoring_pipeline_falls_back_and_keeps_minimal_logs() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="minimal")
    runtime = build_runtime(FailingProvider(), repository)

    result = asyncio.run(
        run_job_scoring_pipeline(
            JobScoringRequest.model_validate(
                {
                    "profile": None,
                    "jobs": [
                        {
                            "id": "job-1",
                            "title": "前端开发实习生",
                            "companyId": "company-1",
                            "companyName": "星河科技",
                            "companyIndustry": "互联网",
                            "workLocation": "上海",
                            "tags": ["前端"],
                            "requiredSkills": ["React"],
                            "description": "页面开发",
                            "isFeatured": True,
                            "deadline": "2026-04-20T00:00:00.000Z",
                            "publishedAt": "2026-04-10T00:00:00.000Z",
                            "popularity": 80,
                        }
                    ],
                }
            ),
            runtime,
            PipelineContext(request_id="req-pipeline-4", user_id="user-4"),
        )
    )

    assert result.data.items[0].jobId == "job-1"
    assert result.meta.provider == "rule-based"
    assert result.meta.fallbackUsed is True
    assert repository.entries[0].output_json["type"] == "object"


def test_daily_advice_pipeline_uses_provider_result() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="full")
    runtime = build_runtime(
      SuccessProvider(
          {
              "daily_advice": DailyAdviceResult.model_validate(
                  {
                      "title": "今天先做定向投递",
                      "body": "优先处理与你画像最匹配的岗位，再补一条项目亮点。",
                      "source": "ai",
                  }
              )
          }
      ),
      repository,
    )

    result = asyncio.run(
        run_daily_advice_pipeline(
            DailyAdviceRequest.model_validate(
                {
                    "profile": {
                        "userId": "user-1",
                        "targetIndustries": ["互联网"],
                        "targetCities": ["上海"],
                        "skills": ["React"],
                        "preferredJobTypes": ["前端开发"],
                    },
                    "curatedAdvice": {
                        "title": "先完善画像",
                        "body": "补全目标城市和技能标签。",
                    },
                    "featuredCompany": None,
                    "featuredJobs": [],
                }
            ),
            runtime,
            PipelineContext(request_id="req-pipeline-5", user_id="user-1"),
        )
    )

    assert result.data.source == "ai"
    assert result.meta.provider == "openai"
    assert repository.entries[0].request_id == "req-pipeline-5"


def test_daily_advice_pipeline_falls_back_to_rule_based_result() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="minimal")
    runtime = build_runtime(FailingProvider(), repository)

    result = asyncio.run(
        run_daily_advice_pipeline(
            DailyAdviceRequest.model_validate(
                {
                    "profile": {
                        "userId": "user-1",
                        "targetIndustries": ["互联网"],
                        "targetCities": ["上海"],
                        "skills": ["React"],
                        "preferredJobTypes": ["前端开发"],
                    },
                    "curatedAdvice": None,
                    "featuredCompany": None,
                    "featuredJobs": [],
                }
            ),
            runtime,
            PipelineContext(request_id="req-pipeline-6", user_id="user-1"),
        )
    )

    assert result.data.source == "ai-fallback"
    assert result.meta.fallbackUsed is True
    assert repository.entries[0].output_json["type"] == "object"
