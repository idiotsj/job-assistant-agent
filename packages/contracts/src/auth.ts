import { z } from "zod";

export const authRoleSchema = z.enum(["user", "admin"]);
export const authStatusSchema = z.enum(["active", "disabled"]);

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().default(null),
  role: authRoleSchema.default("user"),
  status: authStatusSchema.default("active"),
  emailVerifiedAt: z.string().nullable().default(null),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const registerInputSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/\d/, "Password must include a number"),
  name: z.string().trim().min(1).max(80),
});

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const logoutResponseSchema = z.object({
  loggedOut: z.literal(true),
});

export type AuthRole = z.infer<typeof authRoleSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
