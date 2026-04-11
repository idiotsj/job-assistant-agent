import { civilServiceAdviceSchema } from "@job-assistant/contracts/civil-service";
import { createSuccessResponseSchema } from "@job-assistant/contracts/http";

import { apiGet } from "./client";

const civilServiceAdviceResponseSchema = createSuccessResponseSchema(civilServiceAdviceSchema.array());

export async function getCivilServiceAdvice() {
  const response = await apiGet("/api/civil-service/advice", civilServiceAdviceResponseSchema);
  return response.data;
}
