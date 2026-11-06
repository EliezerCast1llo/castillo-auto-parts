import { timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { reconcileBoxfulShipment } from "@/lib/boxful/shipments";
import { observeOperation } from "@/lib/logger";

export function validBoxfulToken(provided: string | null, expected: string) {
  return timingSafeEqual(createHash("sha256").update(provided || "").digest(), createHash("sha256").update(expected).digest()) && Boolean(provided);
}
export async function POST(request: Request) {
  const secret = process.env.BOXFUL_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return Response.json({ ok: false }, { status: 503 });
  // Authentication before body/DB/provider work; invalid traffic spends no error budget.
  if (!validBoxfulToken(request.headers.get(process.env.BOXFUL_WEBHOOK_TOKEN_HEADER || "accessToken"), secret)) return Response.json({ ok: false }, { status: 401 });
  try {
    const text = await request.text();
    if (text.length > 16384) return Response.json({ ok: false }, { status: 413 });
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { return Response.json({ ok: false }, { status: 400 }); }
    const body = z.object({ shipmentId: z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/) }).safeParse(payload);
    if (!body.success) return Response.json({ ok: false }, { status: 400 });
    return await observeOperation("boxful_webhook", async () => {
      const status = await reconcileBoxfulShipment(body.data.shipmentId);
      return Response.json({ ok: true, status });
    });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
