type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error" | "debug", message: string, context?: LogContext) {
  const payload = context ? ` ${JSON.stringify(context)}` : "";
  console[level](`[${level}] ${message}${payload}`);
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
  debug(message: string, context?: LogContext) {
    write("debug", message, context);
  },
};

