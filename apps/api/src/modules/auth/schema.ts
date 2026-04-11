import { z } from "zod";

export {
  authRoleSchema,
  authStatusSchema,
  authUserSchema,
  loginInputSchema,
  logoutResponseSchema,
  registerInputSchema,
} from "@job-assistant/contracts/auth";
export type { AuthStatus, AuthUser, LoginInput, RegisterInput } from "@job-assistant/contracts/auth";

import { authUserSchema } from "@job-assistant/contracts/auth";

export const authUserWithPasswordSchema = authUserSchema.extend({
  passwordHash: z.string(),
});

export type AuthUserWithPassword = z.infer<typeof authUserWithPasswordSchema>;
