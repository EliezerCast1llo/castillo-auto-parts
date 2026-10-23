/** The complete telemetry schema. Never copy an Error, request or caller object. */
export const MONITORING_OPERATIONS = [
  "checkout", "wompi_webhook", "boxful_webhook", "boxful_label", "reconciliation",
  "reservation_cron", "server_unhandled", "client_unhandled", "unknown",
  "admin-action", "admin-settings-action", "sendPasswordResetEmail", "catalog-data-source",
  "createGuestCheckoutFromCart", "clearGuestCartAfterPendingOrder", "createStockAlertRequest",
  "paymentWebhookRejected", "paidOrderRequiresManualReview", "logFailedEmail", "sendOrderConfirmationEmail",
] as const;
const outcomes = ["started", "completed", "failed", "rejected", "manual_review", "invalid_signature", "invalid", "not_found", "processed", "duplicate", "already_processed", "client_error", "client_rejection", "client_boundary", "pending_overdue"];
export type MonitoringOperation = typeof MONITORING_OPERATIONS[number];
export type MonitoringLevel = "error" | "warn" | "info";
export type SafeMonitoringEvent = ReturnType<typeof sanitizeMonitoringEvent>;

export function sanitizeMonitoringEvent(level: MonitoringLevel, input: Record<string, unknown>) {
  const context = MONITORING_OPERATIONS.includes(input.context as MonitoringOperation)
    ? input.context as MonitoringOperation : "unknown";
  // IDs come from our process, never user/order/provider IDs or request headers.
  const correlationId = typeof input.correlationId === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.correlationId)
    ? input.correlationId : crypto.randomUUID();
  return {
    level, context, correlationId, timestamp: new Date().toISOString(),
    outcome: typeof input.outcome === "string" && outcomes.includes(input.outcome) ? input.outcome : "failed",
  };
}
