import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";
import { parseBody } from "@/core/validation/http";
import { registerInputSchema } from "@/modules/auth/schema";

export const POST = withErrorHandling(async (request) => {
  const input = await parseBody(request, registerInputSchema);
  const user = await getServerAppContext().services.auth.register(input);
  return success(user);
});

