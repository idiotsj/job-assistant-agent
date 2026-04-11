import { describe, expect, it } from "vitest";

import { createTestAppContext } from "@/testing/create-test-app-context";

describe("schedule service", () => {
  it("aggregates user items, job deadlines, events, and exam nodes", async () => {
    const context = createTestAppContext();
    const profile = await context.services.profile.getProfile("user-1");

    const timeline = await context.services.schedule.getTimeline("user-1", profile);

    expect(timeline.some((item) => item.source === "user")).toBe(true);
    expect(timeline.some((item) => item.source === "job")).toBe(true);
    expect(timeline.some((item) => item.source === "event")).toBe(true);
    expect(timeline.some((item) => item.source === "exam")).toBe(true);

    const sorted = [...timeline].sort(
      (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    );
    expect(timeline).toEqual(sorted);
  });
});

