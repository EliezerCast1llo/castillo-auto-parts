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

let windowStart = 0;
let sent = 0;
let inFlight = 0;
export async function sendMonitoringEvent(input: SafeMonitoringEvent) {
  const endpoint = sentryEndpoint();
  if (!endpoint) return;
  // Bounded per-process cost and concurrency, including a publicly reachable relay.
  const now = Date.now();
  if (now - windowStart >= 60_000) { windowStart = now; sent = 0; }
  if (sent >= 20 || inFlight >= 2) return;
  sent += 1;
  inFlight += 1;
  const event = sanitizeMonitoringEvent(input.level, input);
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
  finally { inFlight -= 1; }
}
