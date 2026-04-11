import fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import secureSession from "@fastify/secure-session";

import { getAppOrigin, getSessionCookieName, getSessionKey, isProductionRuntime } from "@/core/auth/config";
import { registerApiRoutes } from "@/routes/register-api-routes";

export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: getAppOrigin(),
    credentials: true,
  });

  await app.register(cookie);
  await app.register(secureSession, {
    cookieName: getSessionCookieName(),
    key: getSessionKey(),
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProductionRuntime(),
    },
  });

  await registerApiRoutes(app);

  return app;
}
