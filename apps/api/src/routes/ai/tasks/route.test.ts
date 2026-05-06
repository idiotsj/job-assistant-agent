import { afterEach, describe, expect, it, vi } from "vitest";

import { buildServer } from "@/app/build-server";
import { setServerAppContextForTesting } from "@/app/context";
import { GET as getAiTask, WS } from "@/routes/ai/tasks/route";
import { createTestAppContext } from "@/testing/create-test-app-context";

describe("ai task websocket route", () => {
  afterEach(() => {
    vi.useRealTimers();
    setServerAppContextForTesting(undefined);
  });

  it("accepts websocket subscriptions from authenticated cookie-session users", async () => {
    const context = createTestAppContext();
    setServerAppContextForTesting(context);
    const created = await context.services.aiTasks.createTask({
      capability: "job_resume_rewrite",
      userId: "user-1",
      payloadJson: {
        jobId: "job-1",
        input: {
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        },
      },
    });

    const server = await buildServer();

    try {
      const loginResponse = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "demo@example.com",
          password: "Password123!",
        },
      });
      const cookieHeader = String(loginResponse.headers["set-cookie"]).split(";")[0];

      const socket = await server.injectWS("/api/ai/tasks/ws", {
        headers: {
          cookie: cookieHeader,
        },
      });

      const message = await new Promise<unknown>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for websocket task update"));
        }, 3000);

        socket.on("message", (raw: string | Buffer | ArrayBuffer | Buffer[]) => {
          clearTimeout(timeout);
          resolve(JSON.parse(String(raw)));
        });

        socket.send(
          JSON.stringify({
            type: "subscribe",
            taskIds: [created.taskId],
          }),
        );
      });

      expect(message).toMatchObject({
        type: "task.updated",
        taskId: created.taskId,
        status: "pending",
      });

      socket.close();
    } finally {
      await server.close();
    }
  });

  it("does not emit duplicate terminal task updates forever", async () => {
    vi.useFakeTimers();
    const context = createTestAppContext();
    setServerAppContextForTesting(context);
    const created = await context.services.aiTasks.createTask({
      capability: "job_resume_rewrite",
      userId: "user-1",
      payloadJson: {
        jobId: "job-1",
        input: {
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        },
      },
    });

    const sent: unknown[] = [];
    let closeListener: (() => void) | undefined;
    let messageListener:
      | ((raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>)
      | undefined;
    const socket: Parameters<typeof WS>[0] = {
      send(data: string) {
        sent.push(JSON.parse(data));
      },
      close() {
        return undefined;
      },
      on(event, listener) {
        if (event === "close") {
          closeListener = listener as () => void;
          return;
        }

        messageListener = listener as (raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>;
      },
    };

    const request = {
      headers: {},
      session: {
        get(key: string) {
          if (key === "authUser") {
            return {
              id: "user-1",
              email: "demo@example.com",
              role: "user",
              status: "active",
            };
          }
          return undefined;
        },
      },
    } as unknown as Parameters<typeof WS>[1];

    await WS(socket, request);

    expect(messageListener).toBeTypeOf("function");
    await messageListener?.(Buffer.from(JSON.stringify({ type: "subscribe", taskIds: [created.taskId] })));

    await vi.advanceTimersByTimeAsync(1100);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      taskId: created.taskId,
      status: "pending",
    });

    await context.repositories.aiTasks.markSucceeded(
      created.taskId,
      {
        rewriteSuggestions: {
          version: "v1",
          generatedAt: new Date().toISOString(),
          summary: "done",
          headlineSuggestion: "headline",
          summarySuggestion: "summary",
          keywordSuggestions: ["a", "b", "c"],
          sectionSuggestions: [
            {
              section: "headline",
              currentIssue: "issue",
              rewriteGoal: "goal",
              suggestedText: "text",
            },
            {
              section: "summary",
              currentIssue: "issue",
              rewriteGoal: "goal",
              suggestedText: "text",
            },
          ],
          actionChecklist: ["one", "two"],
        },
        parsed: {
          summary: "parsed",
          detectedSkills: [],
          detectedJobTypes: [],
          detectedCities: [],
          education: {
            university: null,
            major: null,
          },
          confidence: 0.8,
        },
        appliedPatch: {},
        profile: {
          userId: "user-1",
          university: "",
          major: "",
          grade: "",
          targetIndustries: [],
          targetCities: [],
          skills: [],
          preferredJobTypes: [],
          considersPostgraduate: false,
          considersCivilService: false,
          resumeData: null,
        },
      },
      {
        step: "completed",
        message: "Resume rewrite suggestions ready",
        percent: 100,
      },
    );

    await vi.advanceTimersByTimeAsync(1100);
    expect(sent).toHaveLength(2);
    expect(sent[1]).toMatchObject({
      taskId: created.taskId,
      status: "succeeded",
    });

    await vi.advanceTimersByTimeAsync(2500);
    expect(sent).toHaveLength(2);

    closeListener?.();
  });

  it("stops polling task ids that are missing or not owned by the user", async () => {
    vi.useFakeTimers();
    const context = createTestAppContext();
    setServerAppContextForTesting(context);

    let lookupCount = 0;
    const originalLookup = context.repositories.aiTasks.getByIdForUser;
    context.repositories.aiTasks.getByIdForUser = async (taskId, userId) => {
      lookupCount += 1;
      return originalLookup(taskId, userId);
    };

    let closeListener: (() => void) | undefined;
    let messageListener:
      | ((raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>)
      | undefined;
    const sent: unknown[] = [];
    const socket: Parameters<typeof WS>[0] = {
      send(data: string) {
        sent.push(JSON.parse(data));
      },
      close() {
        return undefined;
      },
      on(event, listener) {
        if (event === "close") {
          closeListener = listener as () => void;
          return;
        }

        messageListener = listener as (raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>;
      },
    };

    const request = {
      headers: {},
      session: {
        get(key: string) {
          if (key === "authUser") {
            return {
              id: "user-1",
              email: "demo@example.com",
              role: "user",
              status: "active",
            };
          }
          return undefined;
        },
      },
    } as unknown as Parameters<typeof WS>[1];

    await WS(socket, request);

    expect(messageListener).toBeTypeOf("function");
    await messageListener?.(Buffer.from(JSON.stringify({ type: "subscribe", taskIds: ["missing-task"] })));

    await vi.advanceTimersByTimeAsync(1100);
    expect(sent).toHaveLength(0);
    expect(lookupCount).toBe(1);

    await vi.advanceTimersByTimeAsync(2500);
    expect(sent).toHaveLength(0);
    expect(lookupCount).toBe(1);

    closeListener?.();
  });

  it("notifies the client and closes when task storage becomes unavailable", async () => {
    vi.useFakeTimers();
    const context = createTestAppContext();
    setServerAppContextForTesting(context);

    let closeListener: (() => void) | undefined;
    let messageListener:
      | ((raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>)
      | undefined;
    let closed = false;
    const sent: unknown[] = [];
    const socket: Parameters<typeof WS>[0] = {
      send(data: string) {
        sent.push(JSON.parse(data));
      },
      close() {
        closed = true;
      },
      on(event, listener) {
        if (event === "close") {
          closeListener = listener as () => void;
          return;
        }

        messageListener = listener as (raw: Buffer | ArrayBuffer | Buffer[]) => void | Promise<void>;
      },
    };

    context.repositories.aiTasks.getByIdForUser = async () => {
      throw new Error("temporary db outage");
    };

    const request = {
      headers: {},
      session: {
        get(key: string) {
          if (key === "authUser") {
            return {
              id: "user-1",
              email: "demo@example.com",
              role: "user",
              status: "active",
            };
          }
          return undefined;
        },
      },
    } as unknown as Parameters<typeof WS>[1];

    await WS(socket, request);

    expect(messageListener).toBeTypeOf("function");
    await messageListener?.(Buffer.from(JSON.stringify({ type: "subscribe", taskIds: ["task-1"] })));

    await vi.advanceTimersByTimeAsync(1100);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "error",
      code: "TASK_STORE_UNAVAILABLE",
    });
    expect(closed).toBe(true);

    closeListener?.();
  });

  it("still protects task detail reads by user ownership", async () => {
    const context = createTestAppContext();
    setServerAppContextForTesting(context);
    const created = await context.services.aiTasks.createTask({
      capability: "job_resume_rewrite",
      userId: "user-1",
      payloadJson: {
        jobId: "job-1",
        input: {
          rawText: "同济大学计算机科学专业，熟悉 React。",
          fileName: "resume.txt",
        },
      },
    });

    const response = await getAiTask(
      new Request(`http://localhost/api/ai/tasks/${created.taskId}`, {
        headers: {
          "x-user-id": "user-2",
        },
      }),
    );

    expect(response.status).toBe(404);
  });
});
