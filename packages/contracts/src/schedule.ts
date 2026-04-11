import { z } from "zod";

export const scheduleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.enum(["job", "event", "exam", "user"]),
  startAt: z.string(),
  endAt: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  description: z.string().default(""),
});

const scheduleEditableFields = {
  title: z.string().min(1).max(120),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().default(null),
  city: z.string().max(80).nullable().default(null),
  description: z.string().max(1000).default(""),
};

export const scheduleCreateInputSchema = z
  .object(scheduleEditableFields)
  .refine(
    (value) => !value.endAt || new Date(value.endAt).getTime() >= new Date(value.startAt).getTime(),
    { message: "endAt must be after startAt" },
  );

export const scheduleUpdateInputSchema = z
  .object(scheduleEditableFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one schedule field must be provided",
  })
  .refine(
    (value) =>
      !value.startAt || !value.endAt || new Date(value.endAt).getTime() >= new Date(value.startAt).getTime(),
    { message: "endAt must be after startAt" },
  );

export const scheduleDeleteResultSchema = z.object({
  id: z.string(),
  deleted: z.literal(true),
});

export type ScheduleCreateInput = z.infer<typeof scheduleCreateInputSchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateInputSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
