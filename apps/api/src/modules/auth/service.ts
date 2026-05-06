import { ConflictError, NotFoundError, UnauthorizedError, ValidationAppError } from "@/core/errors/app-error";
import { withTransaction } from "@/core/db/client";
import { createAuthRepository, type AuthRepository } from "@/modules/auth/repository";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { loginInputSchema, registerInputSchema, type AuthUser } from "@/modules/auth/schema";

export interface AuthService {
  register(input: unknown): Promise<AuthUser>;
  validateCredentials(input: unknown): Promise<AuthUser | null>;
  getCurrentUser(userId: string): Promise<AuthUser>;
}

export interface AuthServiceOptions {
  createUserWithProfile?: (input: { email: string; passwordHash: string; name: string }) => Promise<AuthUser>;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "23505"
  );
}

export function createAuthService(repository: AuthRepository, options: AuthServiceOptions = {}): AuthService {
  return {
    async register(input) {
      const parsed = registerInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new ValidationAppError("Invalid registration payload", parsed.error.flatten());
      }

      const existing = await repository.getUserWithPasswordByEmail(parsed.data.email);
      if (existing) {
        throw new ConflictError("Email already registered", undefined, "EMAIL_ALREADY_REGISTERED");
      }

      const passwordHash = await hashPassword(parsed.data.password);

      const persistUser =
        options.createUserWithProfile ??
        (async (persistInput: { email: string; passwordHash: string; name: string }) =>
          withTransaction(async (tx) => {
            const txRepository = createAuthRepository(tx);
            const user = await txRepository.createUser(tx, {
              email: persistInput.email,
              passwordHash: persistInput.passwordHash,
              name: persistInput.name,
            });
            await txRepository.createEmptyProfile(tx, user.id);
            return user;
          }));

      try {
        return await persistUser({
          email: parsed.data.email,
          passwordHash,
          name: parsed.data.name,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictError("Email already registered", undefined, "EMAIL_ALREADY_REGISTERED");
        }
        throw error;
      }
    },

    async validateCredentials(input) {
      const parsed = loginInputSchema.safeParse(input);
      if (!parsed.success) {
        return null;
      }

      const user = await repository.getUserWithPasswordByEmail(parsed.data.email);
      if (!user || user.status !== "active") {
        return null;
      }

      const verified = await verifyPassword(user.passwordHash, parsed.data.password);
      if (!verified) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },

    async getCurrentUser(userId) {
      const user = await repository.getUserById(userId);
      if (!user) {
        throw new NotFoundError("Authenticated user not found", { userId });
      }
      if (user.status !== "active") {
        throw new UnauthorizedError("Account is disabled");
      }
      return user;
    },
  };
}
