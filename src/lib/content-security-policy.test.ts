import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./content-security-policy";

describe("content security policy", () => {
  it.each([undefined, "", "   "])("keeps the exact existing production CSP without a Google Ads ID (%s)", (id) => {
    expect(buildContentSecurityPolicy({
      environment: { NODE_ENV: "production", NEXT_PUBLIC_GOOGLE_ADS_ID: id }, nonce: "abc",
    })).toBe("default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-abc'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' blob: data: https://tile.openstreetmap.org; connect-src 'self' https://nominatim.openstreetmap.org https://api.wompi.sv https://id.wompi.sv; frame-src 'self' https://www.google.com; worker-src 'self' blob:");
  });

  it("adds Google Ads sources to the right directives while retaining existing sources and the nonce", () => {
    const policy = buildContentSecurityPolicy({
      environment: { NODE_ENV: "production", NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-123" }, nonce: "abc",
    });
    const directives = Object.fromEntries(policy.split("; ").map((value) => {
      const [key, ...sources] = value.split(" ");
      return [key, sources];
    }));
    expect(directives["script-src"]).toEqual(["'self'", "'nonce-abc'", "https://www.googletagmanager.com"]);
    expect(directives["connect-src"]).toEqual(expect.arrayContaining([
      "https://nominatim.openstreetmap.org", "https://api.wompi.sv", "https://id.wompi.sv",
      "https://www.google.com", "https://www.google-analytics.com", "https://*.google-analytics.com",
      "https://googleads.g.doubleclick.net", "https://www.googleadservices.com",
    ]));
    expect(directives["img-src"]).toEqual(expect.arrayContaining([
      "https://tile.openstreetmap.org", "https://www.google.com", "https://www.googletagmanager.com",
      "https://googleads.g.doubleclick.net", "https://www.google.com.sv",
    ]));
    expect(directives["frame-src"]).toEqual([
      "'self'", "https://www.google.com", "https://td.doubleclick.net", "https://www.googletagmanager.com",
    ]);
  });

  it("includes the per-request nonce and core hardening directives", () => {
    const policy = buildContentSecurityPolicy({
      environment: { NODE_ENV: "production" },
      nonce: "nonce-value",
    });

    expect(policy).toContain("script-src 'self' 'nonce-nonce-value'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it.each([undefined, "false", "true"])("upgrades insecure requests only when CSP_ENFORCE=%s enables enforcement", (enforce) => {
    const policy = buildContentSecurityPolicy({
      environment: { NODE_ENV: "production", CSP_ENFORCE: enforce },
      nonce: "nonce-value",
    });

    expect(policy.split("; ").includes("upgrade-insecure-requests")).toBe(enforce === "true");
    expect(policy).toContain("script-src 'self' 'nonce-nonce-value'");
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
