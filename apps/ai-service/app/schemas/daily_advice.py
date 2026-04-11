from pydantic import BaseModel, Field

from app.schemas.common import PipelineMeta
from app.schemas.recommendation import JobPayload, ProfilePayload


class DailyAdviceSeed(BaseModel):
    title: str
    body: str


class DailyAdviceCompany(BaseModel):
    id: str
    name: str
    industry: str
    city: str
    description: str = ""
    isFeatured: bool = False


class DailyAdviceRequest(BaseModel):
    profile: ProfilePayload | None = None
    curatedAdvice: DailyAdviceSeed | None = None
    featuredCompany: DailyAdviceCompany | None = None
    featuredJobs: list[JobPayload] = Field(default_factory=list)


class DailyAdviceResult(BaseModel):
    title: str
    body: str
    source: str = "ai"


class DailyAdviceResponse(BaseModel):
    success: bool = True
    data: DailyAdviceResult
    meta: PipelineMeta
