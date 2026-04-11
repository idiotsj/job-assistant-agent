import { z } from "zod";

import { studentCaseSchema } from "./cases";
import { companySchema } from "./companies";
import { dailyAdviceSchema } from "./daily-content";
import { eventSchema } from "./events";
import { jobSchema } from "./jobs";

export const recommendationMetaSchema = z.object({
  score: z.number(),
  reason: z.string(),
  source: z.enum(["jobs", "cases", "events", "dailyAdvice", "companies"]),
});

export const recommendedJobSchema = jobSchema.extend(recommendationMetaSchema.shape);
export const recommendedCaseSchema = studentCaseSchema.extend(recommendationMetaSchema.shape);
export const recommendedEventSchema = eventSchema.extend(recommendationMetaSchema.shape);

export const homeRecommendationSchema = z.object({
  jobs: z.array(recommendedJobSchema),
  cases: z.array(recommendedCaseSchema),
  events: z.array(recommendedEventSchema),
  dailyAdvice: dailyAdviceSchema,
  featuredCompany: companySchema.nullable(),
});

export type RecommendedJob = z.infer<typeof recommendedJobSchema>;
export type RecommendedCase = z.infer<typeof recommendedCaseSchema>;
export type RecommendedEvent = z.infer<typeof recommendedEventSchema>;
export type HomeRecommendation = z.infer<typeof homeRecommendationSchema>;
