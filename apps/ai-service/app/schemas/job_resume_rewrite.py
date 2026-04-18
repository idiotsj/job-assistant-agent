from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta
from app.schemas.recommendation import JobPayload, ProfilePayload
from app.schemas.resume import ResumeParseResult


class JobResumeRewriteRequest(BaseModel):
    rawText: str = Field(min_length=1)
    parsedResume: ResumeParseResult
    profile: ProfilePayload | None = None
    job: JobPayload


class JobResumeRewriteSectionSuggestion(BaseModel):
    section: Literal["headline", "summary", "skills", "project", "experience"]
    currentIssue: str
    rewriteGoal: str
    suggestedText: str


class JobResumeRewriteSuggestionsResult(BaseModel):
    version: str = "v1"
    generatedAt: str
    summary: str
    headlineSuggestion: str
    summarySuggestion: str
    keywordSuggestions: list[str] = Field(min_length=3, max_length=8)
    sectionSuggestions: list[JobResumeRewriteSectionSuggestion] = Field(min_length=2, max_length=5)
    actionChecklist: list[str] = Field(min_length=2, max_length=4)


class JobResumeRewriteResponse(BaseModel):
    success: bool = True
    data: JobResumeRewriteSuggestionsResult
    meta: PipelineMeta
