import { ConfigurationError } from "@/core/errors/app-error";

export function getAiServiceUrl() {
  return process.env.AI_SERVICE_URL?.trim() || null;
}

export function getAiServiceTimeoutMs() {
  const raw = process.env.AI_SERVICE_TIMEOUT_MS ?? "1800";
  const timeoutMs = Number(raw);

  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
    throw new ConfigurationError("AI_SERVICE_TIMEOUT_MS must be between 100 and 30000 milliseconds", {
      value: raw,
    });
  }

  return timeoutMs;
}
