import { createSuccessResponseSchema } from "@job-assistant/contracts/http";
import { interviewPracticeWorkspaceSchema } from "@job-assistant/contracts/interview";

import { apiGet } from "./client";

const interviewPracticeResponseSchema = createSuccessResponseSchema(interviewPracticeWorkspaceSchema);

export async function getInterviewPracticeWorkspace() {
  const response = await apiGet("/api/interview/practice", interviewPracticeResponseSchema);
  return response.data;
}
