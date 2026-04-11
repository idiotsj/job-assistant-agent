import { z, type ZodTypeAny } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const apiFailureSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
});

export function createSuccessResponseSchema<TSchema extends ZodTypeAny>(dataSchema: TSchema) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export function createPaginatedResponseSchema<TSchema extends ZodTypeAny>(dataSchema: TSchema) {
  return z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      total: z.number().int().min(0),
      totalPages: z.number().int().min(0),
    }),
  });
}

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
