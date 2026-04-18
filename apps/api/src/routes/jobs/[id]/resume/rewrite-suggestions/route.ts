import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { jobResumeRewriteSuggestionsInputSchema } from "@/modules/jobs/schema";

function getJobIdFromPath(request: Request) {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const jobsIndex = segments.indexOf("jobs");
  return jobsIndex >= 0 ? segments[jobsIndex + 1] ?? "" : "";
}

export const POST = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const input = await parseBody(request, jobResumeRewriteSuggestionsInputSchema);
  const jobId = getJobIdFromPath(request);
  const result = await getServerAppContext().workflows.jobResumeRewrite.suggest(auth.user.id, jobId, input, {
    requestId: request.headers.get("x-request-id"),
  });
  return success(result);
});
