import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { success } from "@/core/response/json";

export const GET = withErrorHandling(async (request) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  const company = await getServerAppContext().services.companies.getCompany(id);
  return success(company);
});

