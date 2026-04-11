import { createHash } from "node:crypto";

import { ConfigurationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger";

const fallbackSecret = "dev-session-secret-change-me";
let didWarnAboutFallback = false;

function canUseFallbackSecret() {
  return process.env.NODE_ENV !== "production";
}

export function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (!canUseFallbackSecret()) {
    throw new ConfigurationError("SESSION_SECRET is required in production runtime");
  }

  if (!didWarnAboutFallback) {
    logger.warn("Using development session secret fallback. Configure SESSION_SECRET before deployment.");
    didWarnAboutFallback = true;
  }

  return fallbackSecret;
}

export function getSessionKey() {
  return createHash("sha256").update(getSessionSecret()).digest();
}

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME ?? "job_assistant_session";
}

export function getApiHost() {
  return process.env.API_HOST ?? "0.0.0.0";
}

export function getApiPort() {
  const value = process.env.API_PORT ?? "3001";
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError("API_PORT must be a valid TCP port", { value });
  }
  return port;
}

export function getAppOrigin() {
  return process.env.APP_ORIGIN ?? "http://localhost:3000";
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}
