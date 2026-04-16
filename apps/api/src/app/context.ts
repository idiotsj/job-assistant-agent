import { createServerRepositories } from "@/app/create-repositories";
import { createServerServices } from "@/app/create-services";
import { createServerWorkflows } from "@/app/create-workflows";
import type { ServerAppContext, ServerRepositories } from "@/app/contracts";
import { createAiServiceClient } from "@/integrations/ai-service/client";

let singletonContext: ServerAppContext | undefined;
let testingOverride: ServerAppContext | undefined;

export function createServerAppContext(repositories?: Partial<ServerRepositories>): ServerAppContext {
  const resolvedRepositories = createServerRepositories(repositories);
  const aiService = createAiServiceClient();
  const services = createServerServices(resolvedRepositories, { aiService });

  return {
    repositories: resolvedRepositories,
    services,
    workflows: createServerWorkflows(resolvedRepositories, aiService),
  };
}

export function getServerAppContext() {
  if (testingOverride) {
    return testingOverride;
  }

  if (!singletonContext) {
    singletonContext = createServerAppContext();
  }

  return singletonContext;
}

export function setServerAppContextForTesting(context?: ServerAppContext) {
  testingOverride = context;
}
