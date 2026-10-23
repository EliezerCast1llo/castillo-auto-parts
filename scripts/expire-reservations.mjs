import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

/** A Railway cron process must exit after each invocation, not keep a timer alive. */
export async function runReservationCron({ environment = process.env, fetchImplementation = fetch, correlationId = randomUUID() } = {}) {
  const secret = environment.RESERVATION_CRON_SECRET?.trim();
  if (!secret || secret.length < 32 || secret.includes("replace-with")) {
    throw new Error("RESERVATION_CRON_SECRET: configure a secret of at least 32 characters");
  }
  let endpoint;
  try {
    const base = new URL(environment.APP_BASE_URL || "");
    if (base.protocol !== "https:" || base.username || base.password) throw new Error();
    endpoint = new URL("/api/internal/expire-payment-reservations", base);
  } catch {
    throw new Error("APP_BASE_URL: configure the application's HTTPS origin");
  }

  let released = 0;
  // The endpoint handles at most 50 orders. Drain up to 500 per tick; bounded
  // network time (10 x 10s) keeps a failed run shorter than the 5-minute schedule.
  for (let batch = 0; batch < 10; batch += 1) {
    let response;
    try {
      response = await fetchImplementation(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}`, "x-correlation-id": correlationId },
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error("Reservation cron request failed or timed out");
    }
    if (!response.ok) throw new Error(`Reservation cron failed (HTTP ${response.status})`);
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Reservation cron received an invalid response");
    }
    if (payload?.ok !== true || !Number.isInteger(payload.released) || payload.released < 0 || payload.released > 50) {
      throw new Error("Reservation cron received an invalid response");
    }
    released += payload.released;
    if (payload.released < 50) return released;
  }
  throw new Error("Reservation cron reached its 500-order limit; check the backlog before the next tick");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const correlationId = randomUUID();
  const log = (level, outcome) => JSON.stringify({ level, context: "reservation_cron", outcome, correlationId, timestamp: new Date().toISOString() });
  console.log(log("info", "started"));
  runReservationCron({ correlationId }).then(
    () => console.log(log("info", "completed")),
    () => {
      // Our errors deliberately exclude tokens, URLs, response bodies and cause.
      console.error(log("error", "failed"));
      process.exitCode = 1;
    },
  );
}
