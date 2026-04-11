import { logger } from "@/core/logger";
import { getAiServiceTimeoutMs, getAiServiceUrl } from "@/integrations/ai-service/config";
import {
  aiDailyAdviceRequestSchema,
  aiDailyAdviceResponseSchema,
  aiJobScoringRequestSchema,
  aiJobScoringResponseSchema,
  aiResumeParseRequestSchema,
  aiResumeParseResponseSchema,
  type AiDailyAdviceRequest,
  type AiJobScore,
  type AiPipelineMeta,
  type AiResumeParseData,
  type AiResumeParseRequest,
} from "@/integrations/ai-service/schemas";

export interface AiServiceRequestContext {
  requestId?: string | null;
  userId?: string | null;
  capability?: string | null;
}

export interface AiJobScoringResult {
  items: AiJobScore[];
  meta: AiPipelineMeta;
}

export interface AiDailyAdviceResult {
  advice: ReturnType<typeof aiDailyAdviceResponseSchema.parse>["data"];
  meta: AiPipelineMeta;
}

export interface AiResumeParseResult {
  parsed: AiResumeParseData["parsed"];
  patch: AiResumeParseData["patch"];
  meta: AiPipelineMeta;
}

export interface AiServiceClient {
  enabled: boolean;
  generateDailyAdvice(input: AiDailyAdviceRequest, context?: AiServiceRequestContext): Promise<AiDailyAdviceResult>;
  scoreJobs(input: unknown, context?: AiServiceRequestContext): Promise<AiJobScoringResult>;
  parseResume(input: AiResumeParseRequest, context?: AiServiceRequestContext): Promise<AiResumeParseResult>;
}

class DisabledAiServiceClient implements AiServiceClient {
  enabled = false;

  async generateDailyAdvice(): Promise<AiDailyAdviceResult> {
    throw new Error("AI service is disabled");
  }

  async scoreJobs(): Promise<AiJobScoringResult> {
    return {
      items: [],
      meta: {
        provider: "disabled",
        model: "disabled",
        promptVersion: "none",
        latencyMs: 0,
        fallbackUsed: true,
        tokenUsage: null,
      },
    };
  }

  async parseResume(_input: AiResumeParseRequest): Promise<AiResumeParseResult> {
    throw new Error("AI service is disabled");
  }
}

class HttpAiServiceClient implements AiServiceClient {
  enabled = true;

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async generateDailyAdvice(input: AiDailyAdviceRequest, context?: AiServiceRequestContext): Promise<AiDailyAdviceResult> {
    const payload = aiDailyAdviceRequestSchema.parse(input);
    const response = await this.request("/internal/daily/advice", payload, context);
    const parsed = aiDailyAdviceResponseSchema.parse(response);
    return {
      advice: parsed.data,
      meta: parsed.meta,
    };
  }

  async scoreJobs(input: unknown, context?: AiServiceRequestContext): Promise<AiJobScoringResult> {
    const payload = aiJobScoringRequestSchema.parse(input);
    const response = await this.request("/internal/recommend/score-jobs", payload, context);
    const parsed = aiJobScoringResponseSchema.parse(response);
    return {
      items: parsed.data.items,
      meta: parsed.meta,
    };
  }

  async parseResume(input: AiResumeParseRequest, context?: AiServiceRequestContext): Promise<AiResumeParseResult> {
    const payload = aiResumeParseRequestSchema.parse(input);
    const response = await this.request("/internal/resume/parse", payload, context);
    const parsed = aiResumeParseResponseSchema.parse(response);
    return {
      parsed: parsed.data.parsed,
      patch: parsed.data.patch,
      meta: parsed.meta,
    };
  }

  private async request(path: string, payload: unknown, context?: AiServiceRequestContext) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (context?.requestId) {
      headers["x-request-id"] = context.requestId;
    }
    if (context?.userId) {
      headers["x-ai-user-id"] = context.userId;
    }
    if (context?.capability) {
      headers["x-ai-capability"] = context.capability;
    }

    try {
      const response = await fetch(new URL(path, this.baseUrl).toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service request failed with status ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createAiServiceClient(): AiServiceClient {
  const url = getAiServiceUrl();

  if (!url) {
    logger.info("AI service disabled; using TypeScript fallbacks for AI-capable workflows");
    return new DisabledAiServiceClient();
  }

  return new HttpAiServiceClient(url, getAiServiceTimeoutMs());
}
