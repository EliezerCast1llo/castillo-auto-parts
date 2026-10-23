import { logError } from "@/lib/logger";
import { sentryEndpoint } from "@/lib/monitoring";

let windowStart = 0;
let requests = 0;

export async function POST(request: Request) {
  // No provider configured: no reads, logs or outbound requests.
  if (!sentryEndpoint()) return new Response(null, { status: 204 });
  if (request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("content-type") !== "application/json") return new Response(null, { status: 403 });
  const now = Date.now();
  if (now - windowStart >= 60_000) { windowStart = now; requests = 0; }
  if (++requests > 20) return new Response(null, { status: 429 });
  // Read a bounded stream, not request.json() on an attacker-sized body.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let size = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 128) { await reader.cancel(); return new Response(null, { status: 413 }); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    const input = JSON.parse(body);
    if (!input || Object.keys(input).length !== 1 || !["client_error", "client_rejection", "client_boundary"].includes(input.kind)) {
      return new Response(null, { status: 400 });
    }
    await logError({ context: "client_unhandled", outcome: input.kind });
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 400 }); }
  finally { reader.releaseLock(); }
}
