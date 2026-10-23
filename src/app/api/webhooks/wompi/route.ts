import { logError, logInfo, logWarn, observeOperation } from "@/lib/logger";
import { NextResponse } from "next/server";
import { processPaymentWebhookEvent } from "@/lib/payment-events";
import {
  getPaymentProvider,
  getWompiConfig,
  InvalidWompiWebhookSignatureError,
} from "@/lib/payments";

// Sin rate limit por IP: el x-forwarded-for es controlable por el cliente, así que
// limitar por IP permitiría a un atacante falsificar la IP de Wompi y bloquear con
// 429 los webhooks de pago legítimos. La protección real es la verificación HMAC
// (InvalidWompiWebhookSignatureError → 401), que rechaza floods inválidos barato y
// ANTES de cualquier escritura en DB.
export async function POST(request: Request) {
  return observeOperation("wompi_webhook", async (correlationId) => {
    const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "x-correlation-id": correlationId } });
    try {
      const config = getWompiConfig();
      const provider = getPaymentProvider("wompi");
      const event = await provider.verifyWebhook(request);
      const result = await processPaymentWebhookEvent(event, {
        expectedProduction: config.environment === "production",
      });

      if (["invalid", "not_found", "rejected", "manual_review"].includes(result.status)) {
        await logWarn({ context: "wompi_webhook", outcome: result.status });
      } else {
        await logInfo({ context: "wompi_webhook", outcome: result.status });
      }
      if (result.status === "invalid") {
        return respond({ ok: false, reason: result.reason }, 400);
      }
      if (result.status === "not_found") {
        return respond({ ok: false, reason: result.reason }, 404);
      }
      if (result.status === "rejected") {
        return respond({ ok: false, reason: result.reason }, 422);
      }

      return respond({ ok: true, status: result.status });
    } catch (error) {
      if (error instanceof InvalidWompiWebhookSignatureError) {
        await logWarn({ context: "wompi_webhook", outcome: "invalid_signature" });
        return respond({ ok: false, reason: "invalid_signature" }, 401);
      }

      await logError({ context: "wompi_webhook", outcome: "failed" }, error);
      return respond({ ok: false, reason: "webhook_unavailable" }, 503);
    }
  });
}
