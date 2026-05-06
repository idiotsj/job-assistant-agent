import type { FastifyRequest } from "fastify";

import { success } from "@/core/response/json";
import { logoutResponseSchema } from "@/modules/auth/schema";
import { getSession } from "@/routes/auth/session-bridge";

export async function handleLogoutRequest(request: FastifyRequest) {
  getSession(request).delete();
  return success(logoutResponseSchema.parse({ loggedOut: true }));
}
