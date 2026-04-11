import type { EventRepository } from "@/modules/events/repository";
import type { JobRepository } from "@/modules/jobs/repository";
import type { UserProfile } from "@/modules/profile/schema";
import type { ScheduleRepository } from "@/modules/schedule/repository";
import { scheduleItemSchema, type ScheduleItem } from "@/modules/schedule/schema";

export interface BuildScheduleTimelineDeps {
  scheduleRepository: ScheduleRepository;
  jobRepository: JobRepository;
  eventRepository: EventRepository;
}

export async function buildScheduleTimeline(
  userId: string,
  profile: UserProfile | null,
  deps: BuildScheduleTimelineDeps,
): Promise<ScheduleItem[]> {
  const [userItems, jobs, events] = await Promise.all([
    deps.scheduleRepository.listByUserId(userId),
    deps.jobRepository.list({
      page: 1,
      limit: 10,
      city: profile?.targetCities,
      industry: profile?.targetIndustries,
      keyword: undefined,
      featuredOnly: undefined,
    }),
    deps.eventRepository.list({
      page: 1,
      limit: 10,
      city: profile?.targetCities,
      upcomingOnly: true,
    }),
  ]);

  const jobDeadlines = jobs.items
    .filter((job) => Boolean(job.deadline))
    .map((job) =>
      scheduleItemSchema.parse({
        id: `job-${job.id}`,
        title: `${job.title} 截止投递`,
        source: "job",
        startAt: job.deadline,
        endAt: null,
        city: job.workLocation,
        description: `${job.companyName} · ${job.title}`,
      }),
    );

  const eventItems = events.items.map((event) =>
    scheduleItemSchema.parse({
      id: `event-${event.id}`,
      title: event.title,
      source: "event",
      startAt: event.startAt,
      endAt: event.endAt,
      city: event.city,
      description: event.companyName,
    }),
  );

  const examItems: ScheduleItem[] = [];
  if (profile?.considersPostgraduate) {
    examItems.push(
      scheduleItemSchema.parse({
        id: "exam-postgraduate",
        title: "考研进度复盘",
        source: "exam",
        startAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        endAt: null,
        city: null,
        description: "检查复习节奏、目标院校与报名节点。",
      }),
    );
  }

  if (profile?.considersCivilService) {
    examItems.push(
      scheduleItemSchema.parse({
        id: "exam-civil-service",
        title: "考公报名节点检查",
        source: "exam",
        startAt: new Date(Date.now() + 21 * 86_400_000).toISOString(),
        endAt: null,
        city: profile.targetCities[0] ?? null,
        description: "关注公告发布时间与岗位筛选条件。",
      }),
    );
  }

  return [...userItems, ...jobDeadlines, ...eventItems, ...examItems].sort(
    (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );
}
