import { createServerRepositories } from "@/app/create-repositories";
import { createServerServices } from "@/app/create-services";
import type { ServerAppContext, ServerRepositories } from "@/app/contracts";

let singletonContext: ServerAppContext | undefined;
let testingOverride: ServerAppContext | undefined;

export function createServerAppContext(repositories?: Partial<ServerRepositories>): ServerAppContext {
  const resolvedRepositories = createServerRepositories(repositories);

  return {
    repositories: resolvedRepositories,
    services: createServerServices(resolvedRepositories),
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
