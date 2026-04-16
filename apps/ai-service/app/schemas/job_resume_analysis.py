from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta
from app.schemas.recommendation import JobPayload, ProfilePayload
from app.schemas.resume import ResumeParseResult


class JobResumeAnalysisRequest(BaseModel):
    rawText: str = Field(min_length=1)
    parsedResume: ResumeParseResult
    profile: ProfilePayload | None = None
    job: JobPayload


class JobResumeAnalysisActionPlan(BaseModel):
    topPriority: str
    nextSteps: list[str] = Field(min_length=2, max_length=4)


class JobResumeAnalysisResult(BaseModel):
    version: str = "v1"
    generatedAt: str
    overallScore: int = Field(ge=0, le=100)
    verdict: Literal["strong_match", "partial_match", "weak_match"]
    summary: str
    matchedRequirements: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    resumeRisks: list[str] = Field(default_factory=list)
    actionPlan: JobResumeAnalysisActionPlan


class JobResumeAnalysisResponse(BaseModel):
    success: bool = True
    data: JobResumeAnalysisResult
    meta: PipelineMeta
