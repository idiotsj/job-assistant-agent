import { afterEach, describe, expect, it, vi } from "vitest";

const mockedLogger = vi.hoisted(() => ({
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@/core/logger", () => ({
  logger: mockedLogger,
}));

const originalEnv = { ...process.env };

describe("auth config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    mockedLogger.warn.mockReset();
    vi.resetModules();
  });

  it("returns SESSION_SECRET when configured", async () => {
    process.env = {
      ...process.env,
      SESSION_SECRET: "configured-secret",
      NODE_ENV: "production",
    };

    const { getSessionSecret } = await import("@/core/auth/config");

    expect(getSessionSecret()).toBe("configured-secret");
    expect(mockedLogger.warn).not.toHaveBeenCalled();
  });

  it("allows fallback in test runtime and warns once", async () => {
    delete process.env.SESSION_SECRET;
    process.env = {
      ...process.env,
      NODE_ENV: "test",
    };

    const { getSessionSecret } = await import("@/core/auth/config");

    expect(getSessionSecret()).toBe("dev-session-secret-change-me");
    expect(getSessionSecret()).toBe("dev-session-secret-change-me");
    expect(mockedLogger.warn).toHaveBeenCalledTimes(1);
  });

  it("throws in production runtime when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET;
    process.env = {
      ...process.env,
      NODE_ENV: "production",
    };

    const { getSessionSecret } = await import("@/core/auth/config");

    expect(() => getSessionSecret()).toThrowError("SESSION_SECRET is required in production runtime");
  });

  it("exposes host, port, origin, and cookie defaults", async () => {
    process.env = {
      ...process.env,
      API_PORT: "3100",
      API_HOST: "127.0.0.1",
      APP_ORIGIN: "http://localhost:3000",
      SESSION_COOKIE_NAME: "custom_session",
    };

    const { getApiHost, getApiPort, getAppOrigin, getSessionCookieName } = await import("@/core/auth/config");

    expect(getApiPort()).toBe(3100);
    expect(getApiHost()).toBe("127.0.0.1");
    expect(getAppOrigin()).toBe("http://localhost:3000");
    expect(getSessionCookieName()).toBe("custom_session");
  });
});
