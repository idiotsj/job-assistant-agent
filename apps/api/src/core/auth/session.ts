import { UnauthorizedError } from "@/core/errors/app-error";
import { authRoleSchema, authStatusSchema } from "@/modules/auth/schema";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: "user" | "admin";
  status?: "active" | "disabled";
}

export interface AuthContext {
  user: AuthUser;
}

const INTERNAL_AUTH_HEADER_PREFIX = "x-internal-auth-";

function createAuthContextFromHeaders(request: Request): AuthContext | null {
  const sessionUserId = request.headers.get(`${INTERNAL_AUTH_HEADER_PREFIX}user-id`);
  if (!sessionUserId) {
    return null;
  }

  const roleHeader = request.headers.get(`${INTERNAL_AUTH_HEADER_PREFIX}user-role`);
  const statusHeader = request.headers.get(`${INTERNAL_AUTH_HEADER_PREFIX}user-status`);

  return {
    user: {
      id: sessionUserId,
      email: request.headers.get(`${INTERNAL_AUTH_HEADER_PREFIX}user-email`) ?? undefined,
      name: request.headers.get(`${INTERNAL_AUTH_HEADER_PREFIX}user-name`) ?? undefined,
      role: roleHeader ? authRoleSchema.parse(roleHeader) : "user",
      status: statusHeader ? authStatusSchema.parse(statusHeader) : "active",
    },
  };
}

export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const sessionContext = createAuthContextFromHeaders(request);
  if (sessionContext) {
    return sessionContext;
  }

  if (process.env.NODE_ENV === "test") {
    const userId = request.headers.get("x-user-id") ?? request.headers.get("x-demo-user-id");
    if (userId) {
      return {
        user: {
          id: userId,
          email: request.headers.get("x-user-email") ?? undefined,
          name: request.headers.get("x-user-name") ?? undefined,
          role: "user",
          status: "active",
        },
      };
    }
  }
  return null;
}

export async function requireAuth(request: Request) {
  const context = await getAuthContext(request);
  if (!context) {
    throw new UnauthorizedError();
  }
  return context;
}
