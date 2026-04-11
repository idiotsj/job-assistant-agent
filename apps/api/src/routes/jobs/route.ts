import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { paginated } from "@/core/response/json";
import { parseQuery } from "@/core/validation/http";
import { jobListQuerySchema } from "@/modules/jobs/schema";

export const GET = withErrorHandling(async (request) => {
  const query = parseQuery(request, jobListQuerySchema);
  const result = await getServerAppContext().services.jobs.listJobs(query);
  return paginated(result.items, {
    page: query.page,
    limit: query.limit,
    total: result.total,
  });
});

