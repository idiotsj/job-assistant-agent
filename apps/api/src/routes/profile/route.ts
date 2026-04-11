import { getServerAppContext } from "@/app/context";
import { requireAuth } from "@/core/auth/session";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { profileUpdateSchema } from "@/modules/profile/schema";

export const GET = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const profile = await getServerAppContext().services.profile.getProfile(auth.user.id);
  return success(profile);
});

export const PUT = withErrorHandling(async (request) => {
  const auth = await requireAuth(request);
  const input = await parseBody(request, profileUpdateSchema);
  const profile = await getServerAppContext().services.profile.saveProfile(auth.user.id, input);
  return success(profile);
});
