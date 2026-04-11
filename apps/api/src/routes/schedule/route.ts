import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { scheduleCreateInputSchema } from "@/modules/schedule/schema";

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const profile = await getServerAppContext().services.profile.getProfile(auth.user.id);
  const timeline = await getServerAppContext().services.schedule.getTimeline(auth.user.id, profile);
  return success(timeline);
});

export const POST = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const input = await parseBody(request, scheduleCreateInputSchema);
  const item = await getServerAppContext().services.schedule.createUserPlan(auth.user.id, input);
  return success(item);
});
