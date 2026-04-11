import { type DbClient, unsafeQuery } from "@/core/db/client";
import { profileUpdateSchema, userProfileSchema, type ProfileUpdateInput, type UserProfile } from "@/modules/profile/schema";

export interface ProfileRepository {
  getByUserId(userId: string): Promise<UserProfile | null>;
  upsert(userId: string, input: ProfileUpdateInput): Promise<UserProfile>;
}

export function createProfileRepository(db: DbClient): ProfileRepository {
  return {
    async getByUserId(userId) {
      const rows = await unsafeQuery(
        db,
        `
          SELECT
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
          FROM user_profiles
          WHERE user_id = $1
          LIMIT 1
        `,
        [userId],
      );

      return rows[0] ? userProfileSchema.parse(rows[0]) : null;
    },

    async upsert(userId, input) {
      const normalized = profileUpdateSchema.parse(input);
      const rows = await unsafeQuery(
        db,
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (user_id)
          DO UPDATE SET
            university = EXCLUDED.university,
            major = EXCLUDED.major,
            grade = EXCLUDED.grade,
            target_industries = EXCLUDED.target_industries,
            target_cities = EXCLUDED.target_cities,
            skills = EXCLUDED.skills,
            preferred_job_types = EXCLUDED.preferred_job_types,
            considers_postgraduate = EXCLUDED.considers_postgraduate,
            considers_civil_service = EXCLUDED.considers_civil_service,
            resume_data = EXCLUDED.resume_data,
            updated_at = NOW()
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
        [
          userId,
          normalized.university ?? "",
          normalized.major ?? "",
          normalized.grade ?? "",
          normalized.targetIndustries ?? [],
          normalized.targetCities ?? [],
          normalized.skills ?? [],
          normalized.preferredJobTypes ?? [],
          normalized.considersPostgraduate ?? false,
          normalized.considersCivilService ?? false,
          normalized.resumeData ?? null,
        ],
      );

      return userProfileSchema.parse(rows[0]);
    },
  };
}

