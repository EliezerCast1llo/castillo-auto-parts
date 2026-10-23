export async function register() {
  const { warnIfMonitoringMisconfigured } = await import("./lib/monitoring");
  warnIfMonitoringMisconfigured();
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Monitor without replacing Node's fatal-exception/exit behavior.
    const { logError } = await import("./lib/logger");
    process.on("uncaughtExceptionMonitor", (error) => {
      void logError({ context: "server_unhandled", outcome: "failed" }, error);
    });
    const { validateProductionEnvironment } = await import("./lib/production-environment");
    try {
      validateProductionEnvironment();
    } catch (error) {
      // Next.js can catch a rejected hook and keep the listener alive. Invalid
      // production configuration must terminate the instance, not just yield 500s.
      console.error((error as Error).message);
      process.exit(1);
    }
  }
}

// Request data is ignored; only a fixed local code is derived from the Error.
export async function onRequestError(error: unknown) {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logError } = await import("./lib/logger");
    await logError({ context: "server_unhandled", outcome: "failed" }, error);
  } else {
    // Middleware runs on Edge, which cannot load AsyncLocalStorage from Node.
    const { localErrorCode, sanitizeMonitoringEvent } = await import("./lib/monitoring-event");
    const { sendMonitoringEvent } = await import("./lib/monitoring");
    const event = sanitizeMonitoringEvent("error", { context: "server_unhandled", outcome: "failed" });
    console.error(JSON.stringify({ ...event, errorCode: localErrorCode(error) }));
    await sendMonitoringEvent(event);
  }
}
