import { createServerAppContext } from "@/app/context";
import { logger } from "@/core/logger";
import { runAiTaskWorkerLoop } from "@/modules/ai-tasks/worker";

const context = createServerAppContext();

runAiTaskWorkerLoop(context).catch((error) => {
  logger.error("AI task worker crashed", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exitCode = 1;
});
