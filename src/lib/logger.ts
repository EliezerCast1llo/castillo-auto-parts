import { AsyncLocalStorage } from "node:async_hooks";
import { localErrorCode, sanitizeMonitoringEvent, type MonitoringLevel, type MonitoringOperation } from "./monitoring-event";
import { sendMonitoringEvent } from "./monitoring";

const observations = new AsyncLocalStorage<{ correlationId: string; operation: MonitoringOperation }>();

async function log(level: MonitoringLevel, context: { context: string; [key: string]: unknown }, error?: unknown) {
  const observation = observations.getStore();
  const payload = sanitizeMonitoringEvent(level, {
    ...context,
    ...(observation ? { correlationId: observation.correlationId, context: observation.operation } : {}),
  });
  const localPayload = { ...payload, ...(level !== "info" ? { errorCode: localErrorCode(error) } : {}) };
  if (level === "error") console.error(JSON.stringify(localPayload));
  else if (level === "warn") console.warn(JSON.stringify(localPayload));
  else console.log(JSON.stringify(payload));
  if (level !== "info") await sendMonitoringEvent(payload);
  return payload.correlationId;
}

// Only a fixed diagnostic code reaches console; the error never reaches transport.
export function logError(context: { context: string; [key: string]: unknown }, error?: unknown) {
  return log("error", context, error);
}
export function logWarn(context: { context: string; [key: string]: unknown }, error?: unknown) {
  return log("warn", context, error);
}
export function logInfo(context: { context: string; [key: string]: unknown }) { return log("info", context); }

export function observeOperation<T>(
  operation: MonitoringOperation,
  work: (correlationId: string) => Promise<T>,
  correlationId = crypto.randomUUID(),
  options: { isExpectedError?: (error: unknown) => boolean } = {},
): Promise<T> {
  return observations.run({ operation, correlationId }, async () => {
    await logInfo({ context: operation, outcome: "started" });
    try { return await work(correlationId); }
    catch (error) {
      if (options.isExpectedError?.(error)) {
        await logInfo({ context: operation, outcome: "rejected" });
      } else {
        await logError({ context: operation, outcome: "failed" }, error);
      }
      throw error;
    }
  });
}
