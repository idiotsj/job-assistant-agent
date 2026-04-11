import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const user = await getServerAppContext().services.auth.getCurrentUser(auth.user.id);
  return success(user);
});
