/** Only a fixed code crosses the browser boundary; never serialize an Error or location. */
export function reportClientError(kind: "client_error" | "client_rejection" | "client_boundary") {
  if (process.env.NEXT_PUBLIC_ERROR_MONITORING_ENABLED !== "true") return;
  void fetch("/api/monitoring", {
    method: "POST", headers: { "content-type": "application/json" },
    credentials: "omit", referrerPolicy: "no-referrer", body: JSON.stringify({ kind }),
  }).catch(() => {});
}
