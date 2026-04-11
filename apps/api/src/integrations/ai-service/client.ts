import { logger } from "@/core/logger";
import { getAiServiceTimeoutMs, getAiServiceUrl } from "@/integrations/ai-service/config";
import {
  aiJobScoringRequestSchema,
  aiJobScoringResponseSchema,
  aiResumeParseRequestSchema,
  aiResumeParseResponseSchema,
  type AiJobScore,
  type AiResumeParseRequest,
  type AiResumeParseResponse,
} from "@/integrations/ai-service/schemas";

export interface AiServiceClient {
  enabled: boolean;
  scoreJobs(input: unknown): Promise<AiJobScore[]>;
  parseResume(input: AiResumeParseRequest): Promise<AiResumeParseResponse["data"]>;
}

class DisabledAiServiceClient implements AiServiceClient {
  enabled = false;

  async scoreJobs(): Promise<AiJobScore[]> {
    return [];
  }

  async parseResume(_input: AiResumeParseRequest): Promise<AiResumeParseResponse["data"]> {
    throw new Error("AI service is disabled");
  }
}

class HttpAiServiceClient implements AiServiceClient {
  enabled = true;

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async scoreJobs(input: unknown): Promise<AiJobScore[]> {
    const payload = aiJobScoringRequestSchema.parse(input);
    const response = await this.request("/internal/recommend/score-jobs", payload);
    return aiJobScoringResponseSchema.parse(response).data.items;
  }

  async parseResume(input: AiResumeParseRequest): Promise<AiResumeParseResponse["data"]> {
    const payload = aiResumeParseRequestSchema.parse(input);
    const response = await this.request("/internal/resume/parse", payload);
    return aiResumeParseResponseSchema.parse(response).data;
  }

  private async request(path: string, payload: unknown) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(new URL(path, this.baseUrl).toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
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
