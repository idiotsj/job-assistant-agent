import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { scheduleUpdateInputSchema } from "@/modules/schedule/schema";

export const PUT = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  const input = await parseBody(request, scheduleUpdateInputSchema);
  const item = await getServerAppContext().services.schedule.updateUserPlan(auth.user.id, id, input);
  return success(item);
});

export const DELETE = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  await getServerAppContext().services.schedule.deleteUserPlan(auth.user.id, id);
  return success({ id, deleted: true });
});
