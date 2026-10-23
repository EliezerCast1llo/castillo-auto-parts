export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Monitor without replacing Node's fatal-exception/exit behavior.
    const { logError } = await import("./lib/logger");
    process.on("uncaughtExceptionMonitor", () => {
      void logError({ context: "server_unhandled", outcome: "failed" });
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

// Request headers, URL, route parameters and the Error itself are intentionally ignored.
export async function onRequestError() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logError } = await import("./lib/logger");
    await logError({ context: "server_unhandled", outcome: "failed" });
  } else {
    // Middleware runs on Edge, which cannot load AsyncLocalStorage from Node.
    const { sanitizeMonitoringEvent } = await import("./lib/monitoring-event");
    const { sendMonitoringEvent } = await import("./lib/monitoring");
    const event = sanitizeMonitoringEvent("error", { context: "server_unhandled", outcome: "failed" });
    console.error(JSON.stringify(event));
    await sendMonitoringEvent(event);
  }
}
