import { homeRecommendationSchema } from "@job-assistant/contracts/recommendation";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const recommendationResponseSchema = createSuccessResponseSchema(homeRecommendationSchema);

export async function getHomeRecommendations() {
  const response = await apiGet("/api/recommend/home", recommendationResponseSchema);
  return response.data;
}
