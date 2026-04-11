from pydantic import BaseModel, Field


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


class ResumeParseResponse(BaseModel):
    success: bool = True
    data: ResumeParseResult
