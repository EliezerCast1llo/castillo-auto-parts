import { AsyncLocalStorage } from "node:async_hooks";
import { sanitizeMonitoringEvent, type MonitoringLevel, type MonitoringOperation } from "./monitoring-event";
import { sendMonitoringEvent } from "./monitoring";

const observations = new AsyncLocalStorage<{ correlationId: string; operation: MonitoringOperation }>();

async function log(level: MonitoringLevel, context: { context: string; [key: string]: unknown }) {
  const observation = observations.getStore();
  const payload = sanitizeMonitoringEvent(level, {
    ...context,
    ...(observation ? { correlationId: observation.correlationId, context: observation.operation } : {}),
  });
  if (level === "error") console.error(JSON.stringify(payload));
  else if (level === "warn") console.warn(JSON.stringify(payload));
  else console.log(JSON.stringify(payload));
  if (level !== "info") await sendMonitoringEvent(payload);
  return payload.correlationId;
}

// Deliberately ignore error objects, including message/name/stack/cause.
export function logError(context: { context: string; [key: string]: unknown }, _error?: unknown) {
  void _error;
  return log("error", context);
}
export function logWarn(context: { context: string; [key: string]: unknown }, _error?: unknown) {
  void _error;
  return log("warn", context);
}
export function logInfo(context: { context: string; [key: string]: unknown }) { return log("info", context); }

export function observeOperation<T>(operation: MonitoringOperation, work: (correlationId: string) => Promise<T>, correlationId = crypto.randomUUID()): Promise<T> {
  return observations.run({ operation, correlationId }, async () => {
    await logInfo({ context: operation, outcome: "started" });
    try { return await work(correlationId); }
    catch (error) {
      await logError({ context: operation, outcome: "failed" });
      throw error;
    }
  });
}
