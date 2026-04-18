from fastapi import APIRouter, Depends, Request

from app.core.security import require_internal_service_token
from app.dependencies import get_runtime
from app.pipelines import (
    PipelineContext,
    run_daily_advice_pipeline,
    run_job_resume_analysis_pipeline,
    run_job_resume_rewrite_pipeline,
    run_job_scoring_pipeline,
    run_resume_diagnosis_pipeline,
    run_resume_parse_pipeline,
)
from app.schemas.job_resume_analysis import JobResumeAnalysisRequest, JobResumeAnalysisResponse
from app.schemas.job_resume_rewrite import JobResumeRewriteRequest, JobResumeRewriteResponse
from app.schemas.daily_advice import DailyAdviceRequest, DailyAdviceResponse
from app.schemas.recommendation import (
    JobScoringRequest,
    JobScoringResponse,
)
from app.schemas.resume import ResumeParseRequest, ResumeParseResponse
from app.schemas.resume_diagnosis import ResumeDiagnosisRequest, ResumeDiagnosisResponse


router = APIRouter()


@router.get("/health")
def health(request: Request) -> dict:
    settings = get_runtime(request).settings
    return {
        "success": True,
        "data": {
            "status": "ok",
            "service": settings.service_name,
            "environment": settings.environment,
        },
    }


@router.post(
    "/internal/resume/parse",
    response_model=ResumeParseResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def parse_resume_route(request: Request, payload: ResumeParseRequest) -> ResumeParseResponse:
    runtime = get_runtime(request)
    result = await run_resume_parse_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return ResumeParseResponse(data=result.data, meta=result.meta)


@router.post(
    "/internal/resume/diagnose",
    response_model=ResumeDiagnosisResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def diagnose_resume_route(request: Request, payload: ResumeDiagnosisRequest) -> ResumeDiagnosisResponse:
    runtime = get_runtime(request)
    result = await run_resume_diagnosis_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return ResumeDiagnosisResponse(data=result.data, meta=result.meta)


@router.post(
    "/internal/resume/analyze-for-job",
    response_model=JobResumeAnalysisResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def analyze_resume_for_job_route(
    request: Request,
    payload: JobResumeAnalysisRequest,
) -> JobResumeAnalysisResponse:
    runtime = get_runtime(request)
    result = await run_job_resume_analysis_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return JobResumeAnalysisResponse(data=result.data, meta=result.meta)


@router.post(
    "/internal/resume/suggest-rewrite-for-job",
    response_model=JobResumeRewriteResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def suggest_resume_rewrite_for_job_route(
    request: Request,
    payload: JobResumeRewriteRequest,
) -> JobResumeRewriteResponse:
    runtime = get_runtime(request)
    result = await run_job_resume_rewrite_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return JobResumeRewriteResponse(data=result.data, meta=result.meta)


@router.post(
    "/internal/recommend/score-jobs",
    response_model=JobScoringResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def score_jobs_route(request: Request, payload: JobScoringRequest) -> JobScoringResponse:
    runtime = get_runtime(request)
    result = await run_job_scoring_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return JobScoringResponse(data=result.data, meta=result.meta)


@router.post(
    "/internal/daily/advice",
    response_model=DailyAdviceResponse,
    dependencies=[Depends(require_internal_service_token)],
)
async def daily_advice_route(request: Request, payload: DailyAdviceRequest) -> DailyAdviceResponse:
    runtime = get_runtime(request)
    result = await run_daily_advice_pipeline(
        payload,
        runtime,
        PipelineContext(
            request_id=request.headers.get("x-request-id"),
            user_id=request.headers.get("x-ai-user-id"),
        ),
    )
    return DailyAdviceResponse(data=result.data, meta=result.meta)
