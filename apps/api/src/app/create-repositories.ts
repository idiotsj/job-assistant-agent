import { getDbClient } from "@/core/db/client";
import { createAuthRepository } from "@/modules/auth/repository";
import { createCaseRepository } from "@/modules/cases/repository";
import { createCivilServiceRepository } from "@/modules/civil-service/repository";
import { createCompanyRepository } from "@/modules/companies/repository";
import { createDailyContentRepository } from "@/modules/daily-content/repository";
import { createEventRepository } from "@/modules/events/repository";
import { createJobRepository } from "@/modules/jobs/repository";
import { createPostgraduateRepository } from "@/modules/postgraduate/repository";
import { createProfileRepository } from "@/modules/profile/repository";
import { createScheduleRepository } from "@/modules/schedule/repository";

import type { ServerRepositories } from "@/app/contracts";

export function createServerRepositories(overrides?: Partial<ServerRepositories>): ServerRepositories {
  const db = getDbClient();

  return {
    auth: overrides?.auth ?? createAuthRepository(db),
    profile: overrides?.profile ?? createProfileRepository(db),
    jobs: overrides?.jobs ?? createJobRepository(db),
    companies: overrides?.companies ?? createCompanyRepository(db),
    cases: overrides?.cases ?? createCaseRepository(db),
    events: overrides?.events ?? createEventRepository(db),
    dailyContent: overrides?.dailyContent ?? createDailyContentRepository(db),
    postgraduate: overrides?.postgraduate ?? createPostgraduateRepository(db),
    civilService: overrides?.civilService ?? createCivilServiceRepository(db),
    schedule: overrides?.schedule ?? createScheduleRepository(db),
  };
}

