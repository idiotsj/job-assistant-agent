import { ZodError } from "zod";

import { ApiError } from "@/lib/api/client";

export function classifyApiError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  if (error.status === 401 || error.code === "UNAUTHORIZED") {
    return "unauthorized" as const;
  }

  if (error.status === 404 || error.code === "NOT_FOUND") {
    return "not_found" as const;
  }

  if (error.status === 503) {
    return "service_unavailable" as const;
  }

  if (error.code === "VALIDATION_ERROR") {
    return "validation" as const;
  }

  if (error.code === "EMAIL_ALREADY_REGISTERED") {
    return "conflict" as const;
  }

  return "other" as const;
}

export function formatUserFacingError(error: unknown, fallback = "操作没有成功，请稍后再试。") {
  if (error instanceof ApiError) {
    const classification = classifyApiError(error);

    if (classification === "unauthorized") {
      return "当前登录状态已失效，请重新登录。";
    }

    if (classification === "not_found") {
      return "目标内容不存在，或当前已经下线。";
    }

    if (classification === "service_unavailable") {
      return "相关服务暂时不可用，请稍后再试。";
    }

    if (classification === "conflict") {
      return "这个邮箱已经注册过了，可以直接去登录。";
    }

    if (classification === "validation") {
      return "提交内容还不完整，请检查表单后再试。";
    }

    return error.message || fallback;
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return fallback;
}
