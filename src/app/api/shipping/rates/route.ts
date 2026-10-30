import { createAsyncRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";
import { getClientIp } from "@/lib/request-ip";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestCart } from "@/lib/cart";
import { isNationalAddress, isNationalCoordinate } from "@/data/el-salvador";
import { quoteCartShipping } from "@/lib/shipping-checkout";

let limiter: AsyncRateLimiter | undefined;

const destinationSchema = z.object({
  addressLine1: z.string().trim().min(1).max(160), addressLine2: z.string().trim().max(120).optional(),
  landmark: z.string().trim().min(1).max(200), department: z.string().max(80), city: z.string().max(80),
  latitude: z.number(), longitude: z.number(),
}).refine((data) => isNationalAddress(data.department, data.city) && isNationalCoordinate(data.latitude, data.longitude));

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    limiter ??= createAsyncRateLimiter({ maxAttempts: 30, windowMs: 60_000, lockoutMs: 60_000 });
    const attempt = await limiter.registerFailure(`shipping:${getClientIp(request.headers)}`);
    if (!attempt.allowed) return NextResponse.json({ rates: [] }, { headers: { ...headers, "Retry-After": String(attempt.retryAfterSeconds) }, status: 429 });
    const parsed = destinationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ rates: [] }, { headers, status: 400 });
    const cart = await getGuestCart();
    if (!cart.lines.length || cart.hasBlockingIssues) return NextResponse.json({ rates: [] }, { headers });
    const quote = await quoteCartShipping(cart.lines, parsed.data);
    return NextResponse.json({ rates: quote?.rates ?? [], totalWeightGrams: quote?.totalWeightGrams ?? null }, { headers });
  } catch { return NextResponse.json({ rates: [] }, { headers }); }
}
