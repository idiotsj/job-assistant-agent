import { z } from "zod";

import { paginationQuerySchema } from "./http";

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  companyIndustry: z.string(),
  workLocation: z.string(),
  tags: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  description: z.string().default(""),
  isFeatured: z.boolean().default(false),
  deadline: z.string().nullable().default(null),
  publishedAt: z.string(),
  popularity: z.number().int().default(0),
});

export const jobListQuerySchema = paginationQuerySchema.extend({
  city: z.union([z.string(), z.array(z.string())]).optional(),
  industry: z.union([z.string(), z.array(z.string())]).optional(),
  keyword: z.string().optional(),
  featuredOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true")
    .optional(),
});

export type Job = z.infer<typeof jobSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
