import { createServerServices } from "@/app/create-services";
import type { ServerAppContext, ServerRepositories } from "@/app/contracts";
import type { AiServiceClient } from "@/integrations/ai-service/client";
import { type AuthRepository } from "@/modules/auth/repository";
import { type AuthUser } from "@/modules/auth/schema";
import { type CaseRepository } from "@/modules/cases/repository";
import { type StudentCase } from "@/modules/cases/schema";
import { type CivilServiceRepository } from "@/modules/civil-service/repository";
import { type CivilServiceAdvice } from "@/modules/civil-service/schema";
import { type CompanyRepository } from "@/modules/companies/repository";
import { type Company } from "@/modules/companies/schema";
import { type DailyContentRepository } from "@/modules/daily-content/repository";
import { type DailyContent } from "@/modules/daily-content/schema";
import { type EventRepository } from "@/modules/events/repository";
import { type CareerEvent } from "@/modules/events/schema";
import { type JobRepository } from "@/modules/jobs/repository";
import { type Job } from "@/modules/jobs/schema";
import { type PostgraduateRepository } from "@/modules/postgraduate/repository";
import { type PostgraduateAdvice } from "@/modules/postgraduate/schema";
import { type ProfileRepository } from "@/modules/profile/repository";
import { type ProfileUpdateInput, type UserProfile } from "@/modules/profile/schema";
import { type ScheduleRepository } from "@/modules/schedule/repository";
import { type ScheduleItem } from "@/modules/schedule/schema";

interface TestSeed {
  authUsers: Array<AuthUser & { passwordHash: string }>;
  profiles: UserProfile[];
  jobs: Job[];
  companies: Company[];
  cases: StudentCase[];
  events: CareerEvent[];
  dailyContent: DailyContent[];
  postgraduateAdvice: PostgraduateAdvice[];
  civilServiceAdvice: CivilServiceAdvice[];
  scheduleItems: Array<ScheduleItem & { userId: string }>;
}

interface CreateTestAppContextOptions {
  aiService?: AiServiceClient;
}

function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

const defaultSeed: TestSeed = {
  authUsers: [
    {
      id: "user-1",
      email: "demo@example.com",
      name: "演示用户",
      role: "user",
      status: "active",
      emailVerifiedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      createdAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      passwordHash:
        "$argon2id$v=19$m=19456,t=2,p=1$f9r4BtvtI9PRHdhzCD/6xw$ipHShyYD1SMWQlr3QdLvdWnSmXJy9kA0FGItfq2cJ3E",
    },
  ],
  profiles: [
    {
      userId: "user-1",
      university: "同济大学",
      major: "计算机科学",
      grade: "大四",
      targetIndustries: ["互联网"],
      targetCities: ["上海"],
      skills: ["TypeScript", "React", "SQL"],
      preferredJobTypes: ["前端开发"],
      considersPostgraduate: true,
      considersCivilService: false,
      resumeData: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    },
  ],
  jobs: [
    {
      id: "job-1",
      title: "前端开发实习生",
      companyId: "company-1",
      companyName: "星河科技",
      companyIndustry: "互联网",
      workLocation: "上海",
      tags: ["前端", "实习"],
      requiredSkills: ["TypeScript", "React"],
      description: "负责招聘站点前端开发。",
      isFeatured: true,
      deadline: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      publishedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      popularity: 98,
    },
    {
      id: "job-2",
      title: "Web 开发工程师",
      companyId: "company-1",
      companyName: "星河科技",
      companyIndustry: "互联网",
      workLocation: "上海",
      tags: ["Web"],
      requiredSkills: ["React", "SQL"],
      description: "负责企业门户建设。",
      isFeatured: false,
      deadline: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      publishedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
      popularity: 80,
    },
    {
      id: "job-3",
      title: "数据分析助理",
      companyId: "company-2",
      companyName: "明日数据",
      companyIndustry: "数据服务",
      workLocation: "北京",
      tags: ["数据"],
      requiredSkills: ["Python"],
      description: "负责报表分析。",
      isFeatured: false,
      deadline: new Date(Date.now() + 15 * 86_400_000).toISOString(),
      publishedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      popularity: 66,
    },
    {
      id: "job-4",
      title: "前端开发工程师",
      companyId: "company-3",
      companyName: "流光互娱",
      companyIndustry: "互联网",
      workLocation: "上海",
      tags: ["前端"],
      requiredSkills: ["TypeScript"],
      description: "负责活动页面开发。",
      isFeatured: true,
      deadline: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      publishedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      popularity: 91,
    },
  ],
  companies: [
    {
      id: "company-1",
      name: "星河科技",
      industry: "互联网",
      city: "上海",
      description: "聚焦校园招聘与职业成长工具。",
      isFeatured: true,
      updatedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    },
  ],
  cases: [
    {
      id: "case-1",
      title: "从计算机专业到前端开发",
      careerPath: "前端开发",
      backgroundMajor: "计算机科学",
      city: "上海",
      tags: ["React", "TypeScript"],
      summary: "聚焦校园项目包装和作品集优化。",
      isFeatured: true,
      publishedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    },
    {
      id: "case-2",
      title: "数据岗求职复盘",
      careerPath: "数据分析",
      backgroundMajor: "统计学",
      city: "北京",
      tags: ["Python"],
      summary: "强调项目和实习经历。",
      isFeatured: false,
      publishedAt: new Date("2026-03-15T00:00:00.000Z").toISOString(),
    },
  ],
  events: [
    {
      id: "event-1",
      title: "星河科技春招宣讲会",
      companyName: "星河科技",
      companyIndustry: "互联网",
      city: "上海",
      startAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      endAt: new Date(Date.now() + 2 * 86_400_000 + 7_200_000).toISOString(),
      registrationDeadline: new Date(Date.now() + 1 * 86_400_000).toISOString(),
      description: "介绍春招岗位与培养体系。",
      isFeatured: true,
    },
    {
      id: "event-2",
      title: "京津地区双选会",
      companyName: "城市人才中心",
      companyIndustry: "公共服务",
      city: "北京",
      startAt: new Date(Date.now() + 9 * 86_400_000).toISOString(),
      endAt: null,
      registrationDeadline: null,
      description: "综合性招聘会。",
      isFeatured: false,
    },
  ],
  dailyContent: [
    {
      id: "daily-1",
      kind: "advice",
      title: "先投递上海互联网岗位",
      body: "你的城市与行业偏好比较明确，今天优先处理高匹配岗位，并准备针对性的项目介绍。",
      tags: ["投递"],
      targetIndustries: ["互联网"],
      targetCities: ["上海"],
      isFeatured: true,
      activeFrom: null,
      activeTo: null,
    },
  ],
  postgraduateAdvice: [
    {
      id: "pg-1",
      title: "保留考研备选路径",
      summary: "如果你还在比较就业与考研，可先明确目标院校与备考窗口。",
      actionItems: ["确认目标院校", "评估暑期备考计划"],
      targetMajors: ["计算机科学"],
      updatedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    },
  ],
  civilServiceAdvice: [
    {
      id: "cs-1",
      title: "关注本地选调与事业编",
      summary: "优先看上海及周边地区的报名节点。",
      actionItems: ["收藏公告源", "整理报名时间线"],
      targetCities: ["上海"],
      updatedAt: new Date("2026-04-01T00:00:00.000Z").toISOString(),
    },
  ],
  scheduleItems: [
    {
      userId: "user-1",
      id: "personal-1",
      title: "更新简历项目描述",
      source: "user",
      startAt: new Date(Date.now() + 1 * 86_400_000).toISOString(),
      endAt: null,
      city: null,
      description: "补齐两个 React 项目的量化结果。",
    },
  ],
};

export function createTestAppContext(
  seedOverrides: Partial<TestSeed> = {},
  options: CreateTestAppContextOptions = {},
): ServerAppContext {
  const seed: TestSeed = {
    ...defaultSeed,
    ...seedOverrides,
  };

  const authRepository: AuthRepository = {
    async getUserById(id) {
      const user = seed.authUsers.find((item) => item.id === id);
      if (!user) {
        return null;
      }
      const { passwordHash: _passwordHash, ...publicUser } = user;
      return publicUser;
    },
    async getUserWithPasswordByEmail(email) {
      return seed.authUsers.find((item) => item.email === email.toLowerCase()) ?? null;
    },
    async createUser(_db, input) {
      const user: AuthUser & { passwordHash: string } = {
        id: `user-${seed.authUsers.length + 1}`,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role ?? "user",
        status: input.status ?? "active",
        emailVerifiedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      seed.authUsers.push(user);
      const { passwordHash: _passwordHash, ...publicUser } = user;
      return publicUser;
    },
    async createEmptyProfile(_db, userId) {
      const profile: UserProfile = {
        userId,
        university: "",
        major: "",
        grade: "",
        targetIndustries: [],
        targetCities: [],
        skills: [],
        preferredJobTypes: [],
        considersPostgraduate: false,
        considersCivilService: false,
        resumeData: null,
      };
      const index = seed.profiles.findIndex((item) => item.userId === userId);
      if (index === -1) {
        seed.profiles.push(profile);
      } else {
        seed.profiles[index] = profile;
      }
      return profile;
    },
  };

  const profiles = new Map(seed.profiles.map((profile) => [profile.userId, profile]));

  const profileRepository: ProfileRepository = {
    async getByUserId(userId) {
      return profiles.get(userId) ?? null;
    },
    async upsert(userId, input: ProfileUpdateInput) {
      const current =
        profiles.get(userId) ??
        ({
          userId,
          university: "",
          major: "",
          grade: "",
          targetIndustries: [],
          targetCities: [],
          skills: [],
          preferredJobTypes: [],
          considersPostgraduate: false,
          considersCivilService: false,
          resumeData: null,
        } satisfies UserProfile);

      const next = { ...current, ...input, userId };
      profiles.set(userId, next);
      return next;
    },
  };

  const jobRepository: JobRepository = {
    async list(query) {
      let items = [...seed.jobs];
      if (query.city) {
        const cities = Array.isArray(query.city) ? query.city : [query.city];
        items = items.filter((item) => cities.includes(item.workLocation));
      }
      if (query.industry) {
        const industries = Array.isArray(query.industry) ? query.industry : [query.industry];
        items = items.filter((item) => industries.includes(item.companyIndustry));
      }
      if (query.keyword) {
        const keyword = query.keyword;
        items = items.filter((item) => item.title.includes(keyword) || item.companyName.includes(keyword));
      }
      if (query.featuredOnly) {
        items = items.filter((item) => item.isFeatured);
      }
      return {
        items: paginate(items, query.page, query.limit),
        total: items.length,
      };
    },
    async getById(id) {
      return seed.jobs.find((job) => job.id === id) ?? null;
    },
  };

  const companyRepository: CompanyRepository = {
    async list(query) {
      let items = [...seed.companies];
      if (query.city) {
        const cities = Array.isArray(query.city) ? query.city : [query.city];
        items = items.filter((item) => cities.includes(item.city));
      }
      if (query.industry) {
        const industries = Array.isArray(query.industry) ? query.industry : [query.industry];
        items = items.filter((item) => industries.includes(item.industry));
      }
      if (query.keyword) {
        const keyword = query.keyword;
        items = items.filter((item) => item.name.includes(keyword) || item.description.includes(keyword));
      }
      if (query.featuredOnly) {
        items = items.filter((item) => item.isFeatured);
      }
      return {
        items: paginate(items, query.page, query.limit),
        total: items.length,
      };
    },
    async getById(id) {
      return seed.companies.find((company) => company.id === id) ?? null;
    },
    async listFeatured(limit = 5) {
      return seed.companies.filter((company) => company.isFeatured).slice(0, limit);
    },
  };

  const caseRepository: CaseRepository = {
    async list(query) {
      let items = [...seed.cases];
      if (query.careerPath) {
        items = items.filter((item) => item.careerPath === query.careerPath);
      }
      if (query.major) {
        items = items.filter((item) => item.backgroundMajor === query.major);
      }
      return {
        items: paginate(items, query.page, query.limit),
        total: items.length,
      };
    },
  };

  const eventRepository: EventRepository = {
    async list(query) {
      let items = [...seed.events];
      if (query.city) {
        const cities = Array.isArray(query.city) ? query.city : [query.city];
        items = items.filter((item) => cities.includes(item.city));
      }
      if (query.upcomingOnly) {
        items = items.filter((item) => new Date(item.startAt).getTime() >= Date.now());
      }
      return {
        items: paginate(items, query.page, query.limit),
        total: items.length,
      };
    },
  };

  const dailyContentRepository: DailyContentRepository = {
    async listActive(kind) {
      return seed.dailyContent.filter((item) => item.kind === kind);
    },
  };

  const postgraduateRepository: PostgraduateRepository = {
    async list() {
      return seed.postgraduateAdvice;
    },
  };

  const civilServiceRepository: CivilServiceRepository = {
    async list() {
      return seed.civilServiceAdvice;
    },
  };

  const scheduleRepository: ScheduleRepository = {
    async listByUserId(userId) {
      return seed.scheduleItems.filter((item) => item.userId === userId).map(({ userId: _userId, ...item }) => item);
    },
    async getUserItemById(userId, id) {
      const found = seed.scheduleItems.find((item) => item.userId === userId && item.id === id && item.source === "user");
      if (!found) {
        return null;
      }
      const { userId: _userId, ...item } = found;
      return item;
    },
    async createUserItem(userId, input) {
      const item = {
        id: `test-user-item-${seed.scheduleItems.length + 1}`,
        userId,
        source: "user" as const,
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
        city: input.city,
        description: input.description,
      };
      seed.scheduleItems.push(item);
      const { userId: _userId, ...result } = item;
      return result;
    },
    async updateUserItem(userId, id, input) {
      const index = seed.scheduleItems.findIndex(
        (item) => item.userId === userId && item.id === id && item.source === "user",
      );
      if (index === -1) {
        return null;
      }
      const existing = seed.scheduleItems[index]!;
      const merged = {
        ...existing,
        ...input,
      };
      seed.scheduleItems[index] = merged;
      const { userId: _userId, ...result } = merged;
      return result;
    },
    async deleteUserItem(userId, id) {
      const index = seed.scheduleItems.findIndex(
        (item) => item.userId === userId && item.id === id && item.source === "user",
      );
      if (index === -1) {
        return false;
      }
      seed.scheduleItems.splice(index, 1);
      return true;
    },
  };

  const repositories: ServerRepositories = {
    auth: authRepository,
    profile: profileRepository,
    jobs: jobRepository,
    companies: companyRepository,
    cases: caseRepository,
    events: eventRepository,
    dailyContent: dailyContentRepository,
    postgraduate: postgraduateRepository,
    civilService: civilServiceRepository,
    schedule: scheduleRepository,
  };

  return {
    repositories,
    services: createServerServices(repositories, {
      auth: {
        async createUserWithProfile(input) {
          const user = await repositories.auth.createUser({} as never, input);
          await repositories.auth.createEmptyProfile({} as never, user.id);
          return user;
        },
      },
      aiService:
        options.aiService ??
        ({
          enabled: false,
          async scoreJobs() {
            return [];
          },
          async parseResume() {
            throw new Error("AI service disabled in test context");
          },
        } satisfies AiServiceClient),
    }),
  };
}
