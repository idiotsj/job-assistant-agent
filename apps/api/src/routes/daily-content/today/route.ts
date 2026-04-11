import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const profile = await getServerAppContext().services.profile.getProfile(auth.user.id);
  const payload = await getServerAppContext().services.dailyContent.getTodayContent(profile, {
    requestId: request.headers.get("x-request-id"),
    userId: auth.user.id,
    capability: "daily_advice",
  });
  return success(payload);
});
