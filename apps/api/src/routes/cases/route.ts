import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { paginated } from "@/core/response/json";
import { parseQuery } from "@/core/validation/http";
import { caseListQuerySchema } from "@/modules/cases/schema";

export const GET = withErrorHandling(async (request) => {
  const query = parseQuery(request, caseListQuerySchema);
  const result = await getServerAppContext().services.cases.listCases(query);
  return paginated(result.items, {
    page: query.page,
    limit: query.limit,
    total: result.total,
  });
});

