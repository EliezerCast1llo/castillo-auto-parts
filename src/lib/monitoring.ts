import { sanitizeMonitoringEvent, type SafeMonitoringEvent } from "./monitoring-event";

/** Minimal Sentry envelope transport: no SDK integrations, user, URL, stack or breadcrumbs. */
export function sentryEndpoint(dsn = process.env.SENTRY_DSN) {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    if (url.protocol !== "https:" || url.password || url.port || url.search || url.hash ||
      !/^[a-f0-9]{32}$/i.test(url.username) || !/^\/\d+$/.test(url.pathname) ||
      !/^o\d+\.ingest(?:\.[a-z]+)?\.sentry\.io$/.test(url.hostname)) return null;
    return `https://${url.host}/api${url.pathname}/envelope/?sentry_key=${url.username}&sentry_version=7`;
  } catch { return null; }
}

/** Warn locally without echoing the DSN or contacting the provider. */
export function warnIfMonitoringMisconfigured() {
  if (process.env.SENTRY_DSN && !sentryEndpoint()) {
    console.warn(JSON.stringify({ level: "warn", context: "monitoring_configuration", code: "INVALID_SENTRY_DSN",
      message: "SENTRY_DSN is malformed; external monitoring is disabled." }));
  }
}

// Separate rate AND concurrency budgets: a saturated public relay cannot spend
// the server's capacity. Classify only from the sanitized operation, never headers.
const budgets = {
  client: { windowStart: 0, sent: 0, inFlight: 0 },
  server: { windowStart: 0, sent: 0, inFlight: 0 },
};
export async function sendMonitoringEvent(input: SafeMonitoringEvent) {
  const endpoint = sentryEndpoint();
  if (!endpoint) return;
  const event = sanitizeMonitoringEvent(input.level, input);
  const budget = event.context === "client_unhandled" ? budgets.client : budgets.server;
  const now = Date.now();
  if (now - budget.windowStart >= 60_000) { budget.windowStart = now; budget.sent = 0; }
  if (budget.sent >= 20 || budget.inFlight >= 2) return;
  budget.sent += 1;
  budget.inFlight += 1;
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const body = [JSON.stringify({ event_id: eventId }), JSON.stringify({ type: "event" }), JSON.stringify({
    event_id: eventId, timestamp: event.timestamp, platform: "other", level: event.level === "warn" ? "warning" : event.level,
    message: `${event.context}: ${event.outcome}`,
    fingerprint: [event.context, event.outcome],
    tags: { operation: event.context, outcome: event.outcome, correlation_id: event.correlationId },
  })].join("\n") + "\n";
  try {
    await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-sentry-envelope" }, body,
      redirect: "error", signal: AbortSignal.timeout(1000), credentials: "omit" });
  } catch { /* Observability must never affect payment/checkout availability. No retries. */ }
  finally { budget.inFlight -= 1; }
}
