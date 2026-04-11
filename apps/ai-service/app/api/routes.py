from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.recommendation import (
    JobScoringRequest,
    JobScoringResponse,
)
from app.schemas.resume import ResumeParseRequest, ResumeParseResponse
from app.services.job_matcher import score_jobs
from app.services.resume_parser import parse_resume


router = APIRouter()


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "success": True,
        "data": {
            "status": "ok",
            "service": settings.service_name,
            "environment": settings.environment,
        },
    }


@router.post("/internal/resume/parse", response_model=ResumeParseResponse)
def parse_resume_route(payload: ResumeParseRequest) -> ResumeParseResponse:
    return parse_resume(payload)


@router.post("/internal/recommend/score-jobs", response_model=JobScoringResponse)
def score_jobs_route(payload: JobScoringRequest) -> JobScoringResponse:
    return score_jobs(payload)
