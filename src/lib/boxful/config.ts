import "server-only";
import { createHash } from "node:crypto";
import { OperationalError } from "../operational-error";

export function boxfulError(code: "CONFIG_MISSING" | "CONFIG_INVALID" | "PROVIDER_UNAVAILABLE" | "PROVIDER_REJECTED" = "CONFIG_INVALID") {
  return new OperationalError(code, "Boxful operation unavailable.");
}
export function boxfulConfig(env = process.env) {
  const baseUrl = env.BOXFUL_API_BASE_URL?.trim();
  if (!["https://devapi.goboxful.com", "https://api.goboxful.com"].includes(baseUrl ?? "")) throw boxfulError();
  // QA must never create real production waybills, including local production builds.
  if (baseUrl === "https://api.goboxful.com" && (env.VERCEL_ENV !== "production" || env.BOXFUL_PRODUCTION_ENABLED !== "true")) throw boxfulError();
  if (!env.BOXFUL_EMAIL || !env.BOXFUL_PASSWORD) throw boxfulError("CONFIG_MISSING");
  return {
    baseUrl: baseUrl!, email: env.BOXFUL_EMAIL, password: env.BOXFUL_PASSWORD,
    scope: createHash("sha256").update(`${baseUrl}:${env.BOXFUL_EMAIL}`).digest("hex"),
  };
}
export function quoteTtlSeconds() {
  const n = Number(process.env.SHIPPING_QUOTE_TTL_SECONDS || 300);
  return Number.isSafeInteger(n) && n >= 30 && n <= 900 ? n : 300;
}
