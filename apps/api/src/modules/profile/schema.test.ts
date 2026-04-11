import { describe, expect, it } from "vitest";

import { profileUpdateSchema, userProfileSchema } from "@/modules/profile/schema";

describe("profile schema", () => {
  it("fills defaults for explicit profile fields", () => {
    const parsed = userProfileSchema.parse({
      userId: "user-1",
    });

    expect(parsed.targetIndustries).toEqual([]);
    expect(parsed.targetCities).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.considersPostgraduate).toBe(false);
  });

  it("rejects empty updates", () => {
    const parsed = profileUpdateSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});

