import { z } from "zod";

import { paginationQuerySchema } from "./http";

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  companyIndustry: z.string(),
  city: z.string(),
  startAt: z.string(),
  endAt: z.string().nullable().default(null),
  registrationDeadline: z.string().nullable().default(null),
  description: z.string().default(""),
  isFeatured: z.boolean().default(false),
});

export const eventListQuerySchema = paginationQuerySchema.extend({
  city: z.union([z.string(), z.array(z.string())]).optional(),
  upcomingOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true")
    .default(true),
});

export type CareerEvent = z.infer<typeof eventSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
