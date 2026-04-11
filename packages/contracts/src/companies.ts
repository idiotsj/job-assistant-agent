import { z } from "zod";

import { paginationQuerySchema } from "./http";

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  city: z.string(),
  description: z.string().default(""),
  isFeatured: z.boolean().default(false),
  updatedAt: z.string().optional(),
});

export const companyListQuerySchema = paginationQuerySchema.extend({
  city: z.union([z.string(), z.array(z.string())]).optional(),
  industry: z.union([z.string(), z.array(z.string())]).optional(),
  keyword: z.string().optional(),
  featuredOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true")
    .optional(),
});

export type Company = z.infer<typeof companySchema>;
export type CompanyListQuery = z.infer<typeof companyListQuerySchema>;
