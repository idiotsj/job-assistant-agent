from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta


class ResumeParseRequest(BaseModel):
    rawText: str = Field(min_length=1)
    fileName: str | None = None


class ResumeEducation(BaseModel):
    university: str | None = None
    major: str | None = None


class ResumeParseResult(BaseModel):
    summary: str
    detectedSkills: list[str] = Field(default_factory=list)
    detectedJobTypes: list[str] = Field(default_factory=list)
    detectedCities: list[str] = Field(default_factory=list)
    education: ResumeEducation
    confidence: float


class ResumePatchSuggestion(BaseModel):
    university: str | None = None
    major: str | None = None
    skills: list[str] = Field(default_factory=list)
    preferredJobTypes: list[str] = Field(default_factory=list)
    targetCities: list[str] = Field(default_factory=list)


class ResumeParseResponseData(BaseModel):
    parsed: ResumeParseResult
    patch: ResumePatchSuggestion


class ResumeParseResponse(BaseModel):
    success: bool = True
    data: ResumeParseResponseData
    meta: PipelineMeta
