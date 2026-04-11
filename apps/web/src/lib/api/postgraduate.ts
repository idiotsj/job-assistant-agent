import { postgraduateAdviceSchema } from "@job-assistant/contracts/postgraduate";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const postgraduateAdviceResponseSchema = createSuccessResponseSchema(postgraduateAdviceSchema.array());

export async function getPostgraduateAdvice() {
  const response = await apiGet("/api/postgraduate/advice", postgraduateAdviceResponseSchema);
  return response.data;
}
