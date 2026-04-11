import { afterEach, describe, expect, it } from "vitest";

import { setServerAppContextForTesting } from "@/app/context";
import { GET as getMe } from "@/routes/auth/me/route";
import { POST as postRegister } from "@/routes/auth/register/route";
import { createTestAppContext } from "@/testing/create-test-app-context";
import { GET as getCases } from "@/routes/cases/route";
import { GET as getCompanies } from "@/routes/companies/route";
import { GET as getCompany } from "@/routes/companies/[id]/route";
import { GET as getCivilServiceAdvice } from "@/routes/civil-service/advice/route";
import { GET as getTodayContent } from "@/routes/daily-content/today/route";
import { GET as getEvents } from "@/routes/events/route";
import { GET as getJobs } from "@/routes/jobs/route";
import { GET as getPostgraduateAdvice } from "@/routes/postgraduate/advice/route";
import { GET as getProfile, PUT as putProfile } from "@/routes/profile/route";
import { POST as postProfileResumeParse } from "@/routes/profile/resume/parse/route";
import { GET as getRecommendHome } from "@/routes/recommend/home/route";
import { DELETE as deleteScheduleItem, PUT as putScheduleItem } from "@/routes/schedule/[id]/route";
import { GET as getSchedule, POST as postSchedule } from "@/routes/schedule/route";

afterEach(() => {
  setServerAppContextForTesting(undefined);
});

describe("api routes", () => {
  it("registers a user and returns current user for authenticated requests", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const registerResponse = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "Password123!",
          name: "新用户",
        }),
      }),
    );

    const registerPayload = await registerResponse.json();
    expect(registerResponse.status).toBe(200);
    expect(registerPayload.data.email).toBe("newuser@example.com");

    const meResponse = await getMe(
      new Request("http://localhost/api/auth/me", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const mePayload = await meResponse.json();
    expect(meResponse.status).toBe(200);
    expect(mePayload.data.email).toBe("demo@example.com");
  });

  it("rejects duplicate registration", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@example.com",
          password: "Password123!",
          name: "重复用户",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  it("rejects invalid registration payload", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postRegister(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "bad",
          password: "123",
          name: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("serves profile get and put for authenticated users", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const getResponse = await getProfile(
      new Request("http://localhost/api/profile", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const getPayload = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(getPayload.data.userId).toBe("user-1");

    const putResponse = await putProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          grade: "研一",
        }),
      }),
    );

    const putPayload = await putResponse.json();
    expect(putResponse.status).toBe(200);
    expect(putPayload.data.grade).toBe("研一");
  });

  it("parses resume into profile and applies conservative profile patch", async () => {
    setServerAppContextForTesting(
      createTestAppContext(
        {},
        {
          aiService: {
            enabled: true,
            async scoreJobs() {
              return [];
            },
            async parseResume() {
              return {
                summary: "识别到技能和方向",
                detectedSkills: ["Python", "React"],
                detectedJobTypes: ["前端开发"],
                detectedCities: ["上海"],
                education: {
                  university: "同济大学",
                  major: "计算机科学",
                },
                confidence: 0.82,
              };
            },
          },
        },
      ),
    );

    const response = await postProfileResumeParse(
      new Request("http://localhost/api/profile/resume/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "同济大学计算机科学专业，熟悉 Python、React，希望做前端开发。",
          fileName: "resume.txt",
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.parsed.detectedSkills).toContain("Python");
    expect(payload.data.appliedPatch.skills).toContain("Python");
    expect(payload.data.profile.resumeData.parsedResume.fileName).toBe("resume.txt");
  });

  it("rejects invalid profile updates", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await putProfile(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 503 when resume parsing service is unavailable", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await postProfileResumeParse(
      new Request("http://localhost/api/profile/resume/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          rawText: "一份简历文本",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it("guards personalized recommendations behind auth", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getRecommendHome(new Request("http://localhost/api/recommend/home"));
    expect(response.status).toBe(401);
  });

  it("returns sectioned recommendations for authenticated users", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getRecommendHome(
      new Request("http://localhost/api/recommend/home", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.jobs.length).toBeGreaterThan(0);
    expect(payload.data.dailyAdvice).toBeDefined();
    expect(payload.data.featuredCompany?.id).toBe("company-1");
  });

  it("supports jobs, cases, and events list endpoints with pagination", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const jobsResponse = await getJobs(new Request("http://localhost/api/jobs?page=1&limit=2&city=%E4%B8%8A%E6%B5%B7"));
    const jobsPayload = await jobsResponse.json();
    expect(jobsResponse.status).toBe(200);
    expect(jobsPayload.pagination.total).toBeGreaterThanOrEqual(2);

    const casesResponse = await getCases(new Request("http://localhost/api/cases?page=1&limit=1&careerPath=%E5%89%8D%E7%AB%AF%E5%BC%80%E5%8F%91"));
    const casesPayload = await casesResponse.json();
    expect(casesResponse.status).toBe(200);
    expect(casesPayload.data[0].careerPath).toBe("前端开发");

    const eventsResponse = await getEvents(new Request("http://localhost/api/events?page=1&limit=5&city=%E4%B8%8A%E6%B5%B7"));
    const eventsPayload = await eventsResponse.json();
    expect(eventsResponse.status).toBe(200);
    expect(eventsPayload.data[0].city).toBe("上海");
  });

  it("rejects invalid jobs query parameters", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getJobs(new Request("http://localhost/api/jobs?page=0&limit=100"));
    expect(response.status).toBe(400);
  });

  it("supports company list and detail endpoints", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const listResponse = await getCompanies(
      new Request("http://localhost/api/companies?page=1&limit=10&city=%E4%B8%8A%E6%B5%B7"),
    );
    const listPayload = await listResponse.json();
    expect(listResponse.status).toBe(200);
    expect(listPayload.data[0].id).toBe("company-1");

    const detailResponse = await getCompany(new Request("http://localhost/api/companies/company-1"));
    const detailPayload = await detailResponse.json();
    expect(detailResponse.status).toBe(200);
    expect(detailPayload.data.name).toBe("星河科技");
  });

  it("returns 404 for unknown company detail", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await getCompany(new Request("http://localhost/api/companies/company-missing"));
    expect(response.status).toBe(404);
  });

  it("serves daily content and advice channels for authenticated users", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const todayResponse = await getTodayContent(
      new Request("http://localhost/api/daily-content/today", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const todayPayload = await todayResponse.json();
    expect(todayResponse.status).toBe(200);
    expect(todayPayload.data.dailyAdvice.title).toContain("上海");

    const postgraduateResponse = await getPostgraduateAdvice(
      new Request("http://localhost/api/postgraduate/advice", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const postgraduatePayload = await postgraduateResponse.json();
    expect(postgraduateResponse.status).toBe(200);
    expect(postgraduatePayload.data[0].id).toBe("pg-1");

    const civilServiceResponse = await getCivilServiceAdvice(
      new Request("http://localhost/api/civil-service/advice", {
        headers: { "x-user-id": "user-1" },
      }),
    );
    const civilServicePayload = await civilServiceResponse.json();
    expect(civilServiceResponse.status).toBe(200);
    expect(civilServicePayload.data[0].id).toBe("cs-1");
  });

  it("supports schedule timeline read and user plan CRUD", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const timelineResponse = await getSchedule(
      new Request("http://localhost/api/schedule", {
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const timelinePayload = await timelineResponse.json();
    expect(timelineResponse.status).toBe(200);
    expect(timelinePayload.data.length).toBeGreaterThan(0);

    const createResponse = await postSchedule(
      new Request("http://localhost/api/schedule", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "模拟面试准备",
          startAt: "2026-04-10T09:00:00.000Z",
          endAt: "2026-04-10T10:00:00.000Z",
          city: "上海",
          description: "准备 3 个项目案例。",
        }),
      }),
    );
    const createPayload = await createResponse.json();
    expect(createResponse.status).toBe(200);
    expect(createPayload.data.source).toBe("user");

    const updateResponse = await putScheduleItem(
      new Request(`http://localhost/api/schedule/${createPayload.data.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "模拟面试复盘",
        }),
      }),
    );
    const updatePayload = await updateResponse.json();
    expect(updateResponse.status).toBe(200);
    expect(updatePayload.data.title).toBe("模拟面试复盘");

    const deleteResponse = await deleteScheduleItem(
      new Request(`http://localhost/api/schedule/${createPayload.data.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": "user-1",
        },
      }),
    );
    const deletePayload = await deleteResponse.json();
    expect(deleteResponse.status).toBe(200);
    expect(deletePayload.data.deleted).toBe(true);
  });

  it("returns 404 when updating a missing schedule item", async () => {
    setServerAppContextForTesting(createTestAppContext());

    const response = await putScheduleItem(
      new Request("http://localhost/api/schedule/missing-item", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "不会成功",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });
});
