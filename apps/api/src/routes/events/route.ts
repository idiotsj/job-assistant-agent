import { getServerAppContext } from "@/app/context";
import { withErrorHandling } from "@/core/http/route-handler";
import { paginated } from "@/core/response/json";
import { parseQuery } from "@/core/validation/http";
import { eventListQuerySchema } from "@/modules/events/schema";

export const GET = withErrorHandling(async (request) => {
  const query = parseQuery(request, eventListQuerySchema);
  const result = await getServerAppContext().services.events.listEvents(query);
  return paginated(result.items, {
    page: query.page,
    limit: query.limit,
    total: result.total,
  });
});

