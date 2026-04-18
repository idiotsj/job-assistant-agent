interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DemoPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export function buildDemoPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
): DemoPaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;
  const end = start + limit;

  return {
    success: true,
    data: items.slice(start, end),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

export function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function includesText(value: string | undefined | null, keyword: string) {
  if (!keyword.trim()) {
    return true;
  }

  return (value ?? "").toLowerCase().includes(keyword.trim().toLowerCase());
}
