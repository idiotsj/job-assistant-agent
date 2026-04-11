import { z } from "zod";

import { companySchema } from "./companies";
import { jobSchema } from "./jobs";

export const dailyContentSchema = z.object({
  id: z.string(),
  kind: z.enum(["advice", "company", "job"]),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  targetCities: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  activeFrom: z.string().nullable().default(null),
  activeTo: z.string().nullable().default(null),
});

export const dailyAdviceSchema = z.object({
  title: z.string(),
  body: z.string(),
  source: z.string(),
});

export const todayContentSchema = z.object({
  dailyAdvice: dailyAdviceSchema,
  featuredCompany: companySchema.nullable(),
  featuredJobs: z.array(jobSchema).default([]),
});

export type DailyContent = z.infer<typeof dailyContentSchema>;
export type DailyAdvice = z.infer<typeof dailyAdviceSchema>;
export type TodayContent = z.infer<typeof todayContentSchema>;
