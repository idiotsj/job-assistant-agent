import { type DbClient, unsafeQuery } from "@/core/db/client";
import { normalizeDbRow } from "@/core/db/query-helpers";
import { authUserSchema, authUserWithPasswordSchema, type AuthUser, type AuthUserWithPassword } from "@/modules/auth/schema";
import { userProfileSchema, type UserProfile } from "@/modules/profile/schema";

export interface AuthRepository {
  getUserById(id: string): Promise<AuthUser | null>;
  getUserWithPasswordByEmail(email: string): Promise<AuthUserWithPassword | null>;
  createUser(
    db: DbClient,
    input: { email: string; passwordHash: string; name: string; role?: "user" | "admin"; status?: "active" | "disabled" },
  ): Promise<AuthUser>;
  createEmptyProfile(db: DbClient, userId: string): Promise<UserProfile>;
}

export function createAuthRepository(db: DbClient): AuthRepository {
  return {
    async getUserById(id) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            email,
            name,
            role,
            status,
            email_verified_at AS "emailVerifiedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM app_users
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      return rows[0] ? authUserSchema.parse(normalizeDbRow(rows[0])) : null;
    },

    async getUserWithPasswordByEmail(email) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
            id,
            email,
            name,
            role,
            status,
            password_hash AS "passwordHash",
            email_verified_at AS "emailVerifiedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM app_users
          WHERE email = $1
          LIMIT 1
        `,
        [email.toLowerCase()],
      );

      return rows[0] ? authUserWithPasswordSchema.parse(normalizeDbRow(rows[0])) : null;
    },

    async createUser(tx, input) {
      const rows = await unsafeQuery(
        tx,
        `
          INSERT INTO app_users (
            email,
            password_hash,
            name,
            role,
            status
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            email,
            name,
            role,
            status,
            email_verified_at AS "emailVerifiedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [input.email.toLowerCase(), input.passwordHash, input.name, input.role ?? "user", input.status ?? "active"],
      );

      return authUserSchema.parse(normalizeDbRow(rows[0]));
    },

    async createEmptyProfile(tx, userId) {
      const rows = await unsafeQuery(
        tx,
        `
          INSERT INTO user_profiles (
            user_id,
            university,
            major,
            grade,
            target_industries,
            target_cities,
            skills,
            preferred_job_types,
            considers_postgraduate,
            considers_civil_service,
            resume_data
          )
          VALUES ($1, '', '', '', '{}', '{}', '{}', '{}', FALSE, FALSE, NULL)
          ON CONFLICT (user_id)
          DO UPDATE SET updated_at = NOW()
          RETURNING
            user_id AS "userId",
            university,
            major,
            grade,
            target_industries AS "targetIndustries",
            target_cities AS "targetCities",
            skills,
            preferred_job_types AS "preferredJobTypes",
            considers_postgraduate AS "considersPostgraduate",
            considers_civil_service AS "considersCivilService",
            resume_data AS "resumeData",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [userId],
      );

      return userProfileSchema.parse(normalizeDbRow(rows[0]));
    },
  };
}
