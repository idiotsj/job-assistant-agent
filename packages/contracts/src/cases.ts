import { z } from "zod";

import { paginationQuerySchema } from "./http";

export const studentCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  careerPath: z.string(),
  backgroundMajor: z.string(),
  city: z.string().default(""),
  tags: z.array(z.string()).default([]),
  summary: z.string().default(""),
  isFeatured: z.boolean().default(false),
  publishedAt: z.string(),
});

export const caseListQuerySchema = paginationQuerySchema.extend({
  careerPath: z.string().optional(),
  major: z.string().optional(),
});

export type StudentCase = z.infer<typeof studentCaseSchema>;
export type CaseListQuery = z.infer<typeof caseListQuerySchema>;
