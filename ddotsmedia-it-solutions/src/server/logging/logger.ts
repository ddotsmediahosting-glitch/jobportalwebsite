type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, message: string, payload?: unknown) {
  const timestamp = new Date().toISOString();
  console[level](
    JSON.stringify({
      timestamp,
      level,
      message,
      payload: payload ?? null,
    }),
  );
}
