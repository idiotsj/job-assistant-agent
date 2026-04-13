from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta
from app.schemas.recommendation import ProfilePayload
from app.schemas.resume import ResumeParseResult


class ResumeDiagnosisRequest(BaseModel):
    rawText: str = Field(min_length=1)
    parsedResume: ResumeParseResult
    profile: ProfilePayload | None = None


class ResumeDiagnosisQuality(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    missingInfo: list[str] = Field(default_factory=list)


class ResumeDiagnosisAlignment(BaseModel):
    targetSummary: str
    matchedSignals: list[str] = Field(default_factory=list)
    gapSignals: list[str] = Field(default_factory=list)


class ResumeDiagnosisActionPlan(BaseModel):
    topPriority: str
    nextSteps: list[str] = Field(default_factory=list)


class ResumeDiagnosisResult(BaseModel):
    version: str = "v1"
    generatedAt: str
    overallScore: int = Field(ge=0, le=100)
    summary: str
    quality: ResumeDiagnosisQuality
    alignment: ResumeDiagnosisAlignment
    actionPlan: ResumeDiagnosisActionPlan


class ResumeDiagnosisResponse(BaseModel):
    success: bool = True
    data: ResumeDiagnosisResult
    meta: PipelineMeta
