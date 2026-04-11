from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta


class ProfilePayload(BaseModel):
    userId: str | None = None
    university: str = ""
    major: str = ""
    grade: str = ""
    targetIndustries: list[str] = Field(default_factory=list)
    targetCities: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    preferredJobTypes: list[str] = Field(default_factory=list)
    considersPostgraduate: bool = False
    considersCivilService: bool = False
    resumeData: dict[str, Any] | None = None


class JobPayload(BaseModel):
    id: str
    title: str
    companyId: str
    companyName: str
    companyIndustry: str
    workLocation: str
    tags: list[str] = Field(default_factory=list)
    requiredSkills: list[str] = Field(default_factory=list)
    description: str = ""
    isFeatured: bool = False
    deadline: str | None = None
    publishedAt: str
    popularity: int = 0


class JobScoringRequest(BaseModel):
    profile: ProfilePayload | None = None
    jobs: list[JobPayload] = Field(default_factory=list)


class JobScoreItem(BaseModel):
    jobId: str
    score: int
    reason: str
    signals: list[str] = Field(default_factory=list)


class JobScoringResponseData(BaseModel):
    items: list[JobScoreItem] = Field(default_factory=list)


class JobScoringResponse(BaseModel):
    success: bool = True
    data: JobScoringResponseData
    meta: PipelineMeta
