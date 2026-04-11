import { AppError } from "@/core/errors/app-error";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function success<T>(data: T, meta: Record<string, unknown> = {}) {
  return Response.json({
    success: true,
    data,
    ...meta,
  });
}

export function paginated<T>(data: T[], pagination: PaginationMeta, meta: Record<string, unknown> = {}) {
  return Response.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit) || 0,
    },
    ...meta,
  });
}

export function failure(error: AppError) {
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? {},
      },
    },
    { status: error.status },
  );
}

