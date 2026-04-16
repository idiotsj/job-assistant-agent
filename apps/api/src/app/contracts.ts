import type { AuthRepository } from "@/modules/auth/repository";
import type { AuthService } from "@/modules/auth/service";
import type { CaseRepository } from "@/modules/cases/repository";
import type { CasesService } from "@/modules/cases/service";
import type { CivilServiceRepository } from "@/modules/civil-service/repository";
import type { CivilServiceService } from "@/modules/civil-service/service";
import type { CompanyRepository } from "@/modules/companies/repository";
import type { CompaniesService } from "@/modules/companies/service";
import type { DailyContentRepository } from "@/modules/daily-content/repository";
import type { DailyContentService } from "@/modules/daily-content/service";
import type { EventRepository } from "@/modules/events/repository";
import type { EventsService } from "@/modules/events/service";
import type { JobRepository } from "@/modules/jobs/repository";
import type { JobsService } from "@/modules/jobs/service";
import type { PostgraduateRepository } from "@/modules/postgraduate/repository";
import type { PostgraduateService } from "@/modules/postgraduate/service";
import type { ProfileRepository } from "@/modules/profile/repository";
import type { ProfileService } from "@/modules/profile/service";
import type { RecommendationService } from "@/modules/recommendation/service";
import type { ScheduleRepository } from "@/modules/schedule/repository";
import type { ScheduleService } from "@/modules/schedule/service";
import type { JobResumeAnalysisWorkflow } from "@/workflows/job-resume-analysis/run-job-resume-analysis";

export interface ServerRepositories {
  auth: AuthRepository;
  profile: ProfileRepository;
  jobs: JobRepository;
  companies: CompanyRepository;
  cases: CaseRepository;
  events: EventRepository;
  dailyContent: DailyContentRepository;
  postgraduate: PostgraduateRepository;
  civilService: CivilServiceRepository;
  schedule: ScheduleRepository;
}

export interface ServerServices {
  auth: AuthService;
  profile: ProfileService;
  jobs: JobsService;
  companies: CompaniesService;
  cases: CasesService;
  events: EventsService;
  dailyContent: DailyContentService;
  postgraduate: PostgraduateService;
  civilService: CivilServiceService;
  schedule: ScheduleService;
  recommendation: RecommendationService;
}

export interface ServerWorkflows {
  jobResumeAnalysis: JobResumeAnalysisWorkflow;
}

export interface ServerAppContext {
  repositories: ServerRepositories;
  services: ServerServices;
  workflows: ServerWorkflows;
}
