import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const profile = await getServerAppContext().services.profile.getProfile(auth.user.id);
  const advice = await getServerAppContext().services.civilService.getAdvice(profile);
  return success(advice);
});
