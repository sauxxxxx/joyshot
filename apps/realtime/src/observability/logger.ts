type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  const entry = JSON.stringify({ level, time: new Date().toISOString(), service: "joyshot-realtime", message, ...context });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
};
