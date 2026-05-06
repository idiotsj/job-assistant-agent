import { describe, expect, it } from "vitest";

import { createAuthService } from "@/modules/auth/service";
import type { AuthRepository } from "@/modules/auth/repository";

function createAuthRepositoryStub(): AuthRepository {
  return {
    async getUserById() {
      return null;
    },
    async getUserWithPasswordByEmail() {
      return null;
    },
    async createUser() {
      throw new Error("not implemented");
    },
    async createEmptyProfile() {
      throw new Error("not implemented");
    },
  };
}

describe("auth service", () => {
  it("maps database unique violations to EMAIL_ALREADY_REGISTERED", async () => {
    const service = createAuthService(createAuthRepositoryStub(), {
      async createUserWithProfile() {
        const error = Object.assign(new Error("duplicate key value violates unique constraint"), {
          code: "23505",
        });
        throw error;
      },
    });

    await expect(
      service.register({
        email: "demo@example.com",
        password: "Password123!",
        name: "Demo",
      }),
    ).rejects.toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
      status: 409,
    });
  });
});
