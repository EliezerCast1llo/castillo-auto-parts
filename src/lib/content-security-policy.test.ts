import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./content-security-policy";

describe("content security policy", () => {
  it("includes the per-request nonce and core hardening directives", () => {
    const policy = buildContentSecurityPolicy({
      environment: { NODE_ENV: "production" },
      nonce: "nonce-value",
    });

    expect(policy).toContain("script-src 'self' 'nonce-nonce-value'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("adds configured external origins without leaking invalid URLs", () => {
    const policy = buildContentSecurityPolicy({
      environment: {
        CLOUDFLARE_R2_PUBLIC_URL: "https://assets.castillo.test/products",
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://selected-bird-123.upstash.io",
        WOMPI_API_BASE_URL: "https://api.wompi.test/v1",
        WOMPI_IDENTITY_BASE_URL: "not-a-url",
      },
      nonce: "abc",
    });

    expect(policy).toContain("img-src 'self' blob: data: https://tile.openstreetmap.org https://assets.castillo.test");
    expect(policy).toContain("connect-src 'self' https://nominatim.openstreetmap.org https://selected-bird-123.upstash.io https://api.wompi.test");
    expect(policy).not.toContain("not-a-url");
  });

  it("allows development-only sources needed by local Next.js and seed imagery", () => {
    const policy = buildContentSecurityPolicy({
      environment: { NODE_ENV: "development" },
      nonce: "dev",
    });

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("https://images.unsplash.com");
  });
});
