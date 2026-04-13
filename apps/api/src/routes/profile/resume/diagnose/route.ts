import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { profileResumeDiagnoseInputSchema } from "@/modules/profile/schema";

export const POST = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const input = await parseBody(request, profileResumeDiagnoseInputSchema);
  const result = await getServerAppContext().services.profile.diagnoseResume(auth.user.id, input, {
    requestId: request.headers.get("x-request-id"),
  });
  return success(result);
});
