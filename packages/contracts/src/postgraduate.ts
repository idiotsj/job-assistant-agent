import { z } from "zod";

export const postgraduateAdviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()).default([]),
  targetMajors: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

export type PostgraduateAdvice = z.infer<typeof postgraduateAdviceSchema>;
