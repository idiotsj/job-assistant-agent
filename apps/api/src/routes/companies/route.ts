import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { paginated } from "@/core/response/json";
import { parseQuery } from "@/core/validation/http";
import { companyListQuerySchema } from "@/modules/companies/schema";

export const GET = withErrorHandling(async (request) => {
  const query = parseQuery(request, companyListQuerySchema);
  const result = await getServerAppContext().services.companies.listCompanies(query);
  return paginated(result.items, {
    page: query.page,
    limit: query.limit,
    total: result.total,
  });
});

