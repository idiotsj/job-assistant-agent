import { z } from "zod";

export const civilServiceAdviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()).default([]),
  targetCities: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

export type CivilServiceAdvice = z.infer<typeof civilServiceAdviceSchema>;
