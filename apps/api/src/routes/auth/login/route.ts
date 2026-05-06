import type { FastifyRequest } from "fastify";

import { getServerAppContext } from "@/app/context";
import { UnauthorizedError } from "@/core/errors/app-error";
import { parseBody } from "@/core/validation/http";
import { success } from "@/core/response/json";
import { loginInputSchema } from "@/modules/auth/schema";
import { type SessionUser, getSession } from "@/routes/auth/session-bridge";

export async function handleLoginRequest(request: FastifyRequest, webRequest: Request) {
  const input = await parseBody(webRequest, loginInputSchema);
  const user = await getServerAppContext().services.auth.validateCredentials(input);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  getSession(request).set("authUser", {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  } satisfies SessionUser);

  return success(user);
}
