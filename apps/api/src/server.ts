import { buildServer } from "@/app/build-server";
import { getApiHost, getApiPort } from "@/core/auth/config";
import { logger } from "@/core/logger";

const server = await buildServer();

try {
  const address = await server.listen({
    host: getApiHost(),
    port: getApiPort(),
  });

  logger.info("API server started", { address });
} catch (error) {
  logger.error("API server failed to start", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
