import type { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from "fastify";
import websocket from "@fastify/websocket";

import { getServerAppContext } from "@/app/context";
import { normalizeError } from "@/core/errors/app-error";
import { attachRequestId, resolveRequestId } from "@/core/http/request-id";
import { logger } from "@/core/logger";
import { failure, success } from "@/core/response/json";
import { GET as getMe } from "@/routes/auth/me/route";
import { handleLoginRequest } from "@/routes/auth/login/route";
import { handleLogoutRequest } from "@/routes/auth/logout/route";
import { POST as postRegister } from "@/routes/auth/register/route";
import { SessionUser, getSession } from "@/routes/auth/session-bridge";
import { GET as getCases } from "@/routes/cases/route";
import { GET as getCivilServiceAdvice } from "@/routes/civil-service/advice/route";
import { GET as getCompanies } from "@/routes/companies/route";
import { GET as getCompany } from "@/routes/companies/[id]/route";
import { GET as getTodayContent } from "@/routes/daily-content/today/route";
import { GET as getEvents } from "@/routes/events/route";
import { GET as getJobs } from "@/routes/jobs/route";
import { GET as getJob } from "@/routes/jobs/[id]/route";
import { POST as postJobResumeAnalyze } from "@/routes/jobs/[id]/resume/analyze/route";
import { POST as postJobResumeRewriteSuggestions } from "@/routes/jobs/[id]/resume/rewrite-suggestions/route";
import { GET as getPostgraduateAdvice } from "@/routes/postgraduate/advice/route";
import { GET as getProfile, PUT as putProfile } from "@/routes/profile/route";
import { POST as postProfileResumeDiagnose } from "@/routes/profile/resume/diagnose/route";
import { POST as postProfileResumeParse } from "@/routes/profile/resume/parse/route";
import { GET as getRecommendHome } from "@/routes/recommend/home/route";
import { DELETE as deleteScheduleItem, PUT as putScheduleItem } from "@/routes/schedule/[id]/route";
import { GET as getSchedule, POST as postSchedule } from "@/routes/schedule/route";
import { GET as getAiTask, GET_LIST as getAiTasks, WS as aiTasksWs } from "@/routes/ai/tasks/route";
import { POST as postJobResumeRewriteTask } from "@/routes/jobs/[id]/resume/rewrite-suggestions/tasks/route";

type WebRouteHandler = (request: Request) => Promise<Response>;

const FORWARDED_INTERNAL_AUTH_HEADERS = new Set([
  "x-internal-auth-user-id",
  "x-internal-auth-user-email",
  "x-internal-auth-user-name",
  "x-internal-auth-user-role",
  "x-internal-auth-user-status",
  "x-session-user-id",
  "x-session-user-email",
  "x-session-user-name",
  "x-session-user-role",
  "x-session-user-status",
  "x-user-id",
  "x-user-email",
  "x-user-name",
  "x-demo-user-id",
]);

function appendHeader(headers: Headers, key: string, value: string | string[]) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      headers.append(key, entry);
    }
    return;
  }

  headers.set(key, value);
}

function toWebRequest(request: FastifyRequest): Request {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) {
      continue;
    }
    if (FORWARDED_INTERNAL_AUTH_HEADERS.has(key)) {
      continue;
    }

    appendHeader(headers, key, value);
  }

  const sessionUser = getSession(request).get("authUser") as SessionUser | undefined;
  if (sessionUser?.id) {
    headers.set("x-internal-auth-user-id", sessionUser.id);
    if (sessionUser.email) {
      headers.set("x-internal-auth-user-email", sessionUser.email);
    }
    if (sessionUser.role) {
      headers.set("x-internal-auth-user-role", sessionUser.role);
    }
    if (sessionUser.status) {
      headers.set("x-internal-auth-user-status", sessionUser.status);
    }
  }

  const host = request.headers.host ?? "localhost";
  const url = new URL(request.raw.url ?? "/", `${request.protocol}://${host}`).toString();

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.body !== undefined) {
    init.body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);

    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  return new Request(url, init);
}

async function sendWebResponse(reply: FastifyReply, response: Response) {
  reply.status(response.status);

  response.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = await response.text();

  if (!payload) {
    return reply.send();
  }

  if (contentType.includes("application/json")) {
    return reply.send(JSON.parse(payload) as unknown);
  }

  return reply.send(payload);
}

async function executeCustomRoute(
  request: FastifyRequest,
  reply: FastifyReply,
  handler: (webRequest: Request) => Promise<Response>,
) {
  const webRequest = toWebRequest(request);
  const requestId = resolveRequestId(webRequest);
  const startedAt = Date.now();

  try {
    const response = await handler(webRequest);
    return sendWebResponse(reply, attachRequestId(response, requestId));
  } catch (error) {
    const normalized = normalizeError(error);
    logger.error("Custom route handler failed", {
      requestId,
      method: request.method,
      path: new URL(webRequest.url).pathname,
      code: normalized.code,
      message: normalized.message,
      durationMs: Date.now() - startedAt,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return sendWebResponse(reply, attachRequestId(failure(normalized), requestId));
  }
}

function registerWebRoute(
  app: FastifyInstance,
  method: HTTPMethods,
  url: string,
  handler: WebRouteHandler,
) {
  app.route({
    method,
    url,
    handler: async (request, reply) => {
      const webRequest = toWebRequest(request);
      const response = await handler(webRequest);
      return sendWebResponse(reply, response);
    },
  });
}

export async function registerApiRoutes(app: FastifyInstance) {
  await app.register(websocket);

  app.get("/health", async () => ({
    success: true,
    data: {
      status: "ok",
    },
  }));

  app.post("/api/auth/login", async (request, reply) => {
    return executeCustomRoute(request, reply, async (webRequest) => handleLoginRequest(request, webRequest));
  });

  app.post("/api/auth/logout", async (request, reply) => {
    return executeCustomRoute(request, reply, async () => handleLogoutRequest(request));
  });

  registerWebRoute(app, "GET", "/api/auth/me", getMe);
  registerWebRoute(app, "POST", "/api/auth/register", postRegister);
  registerWebRoute(app, "GET", "/api/profile", getProfile);
  registerWebRoute(app, "PUT", "/api/profile", putProfile);
  registerWebRoute(app, "POST", "/api/profile/resume/parse", postProfileResumeParse);
  registerWebRoute(app, "POST", "/api/profile/resume/diagnose", postProfileResumeDiagnose);
  registerWebRoute(app, "GET", "/api/recommend/home", getRecommendHome);
  registerWebRoute(app, "GET", "/api/jobs", getJobs);
  registerWebRoute(app, "GET", "/api/jobs/:id", getJob);
  registerWebRoute(app, "POST", "/api/jobs/:id/resume/analyze", postJobResumeAnalyze);
  registerWebRoute(app, "POST", "/api/jobs/:id/resume/rewrite-suggestions", postJobResumeRewriteSuggestions);
  registerWebRoute(app, "POST", "/api/jobs/:id/resume/rewrite-suggestions/tasks", postJobResumeRewriteTask);
  registerWebRoute(app, "GET", "/api/companies", getCompanies);
  registerWebRoute(app, "GET", "/api/companies/:id", getCompany);
  registerWebRoute(app, "GET", "/api/cases", getCases);
  registerWebRoute(app, "GET", "/api/events", getEvents);
  registerWebRoute(app, "GET", "/api/daily-content/today", getTodayContent);
  registerWebRoute(app, "GET", "/api/schedule", getSchedule);
  registerWebRoute(app, "POST", "/api/schedule", postSchedule);
  registerWebRoute(app, "PUT", "/api/schedule/:id", putScheduleItem);
  registerWebRoute(app, "DELETE", "/api/schedule/:id", deleteScheduleItem);
  registerWebRoute(app, "GET", "/api/ai/tasks", getAiTasks);
  registerWebRoute(app, "GET", "/api/ai/tasks/:id", getAiTask);
  registerWebRoute(app, "GET", "/api/postgraduate/advice", getPostgraduateAdvice);
  registerWebRoute(app, "GET", "/api/civil-service/advice", getCivilServiceAdvice);

  app.get("/api/ai/tasks/ws", { websocket: true }, async (socket, request) => {
    await aiTasksWs(socket, request);
  });
}
