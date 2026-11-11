import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const apex = "castilloautoparts.com";
const legacy = "castillo-auto-parts.vercel.app";

async function request(host: string, path = "/?gclid=x") {
  const { default: nextConfig } = await import("../../next.config");
  return unstable_getResponseFromNextConfig({
    url: `https://${host}${path}`,
    headers: { host },
    nextConfig,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("canonical landing origin", () => {
  it.each([undefined, "", "  "])("defaults to the apex when the environment value is %s", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
    const { landingSiteUrl } = await import("./landing-site-url");
    expect(landingSiteUrl()).toBe(`https://${apex}`);
  });

  it("uses the configured origin without a path or trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/custom/");
    const { landingSiteUrl } = await import("./landing-site-url");
    expect(landingSiteUrl()).toBe("https://example.com");
  });
});

describe("legacy Vercel domain redirect", () => {
  it.each([
    ["production", undefined, `https://${apex}`],
    ["production", "false", `https://${apex}`],
    ["preview", "true", `https://${apex}`],
    ["development", "true", `https://${apex}`],
    [undefined, "true", `https://${apex}`],
    ["production", "true", `https://${legacy}`],
  ])("stays off for environment=%s flag=%s origin=%s", async (environment, flag, siteUrl) => {
    vi.stubEnv("VERCEL_ENV", environment);
    vi.stubEnv("LEGACY_VERCEL_REDIRECT_ENABLED", flag);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
    expect((await request(legacy)).headers.get("location")).toBeNull();
  });

  it("redirects the exact production host and preserves the path and ad parameters", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("LEGACY_VERCEL_REDIRECT_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", `https://${apex}/`);

    for (const path of ["/?gclid=x", "/en?gclid=a%2Bb&utm_source=google", "/sitemap.xml"]) {
      const response = await request(legacy, path);
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(`https://${apex}${path}`);
    }
    for (const host of [apex, "castillo-auto-parts-git-feature.vercel.app", "castillo-auto-partsxvercelyapp"]) {
      expect((await request(host)).headers.get("location")).toBeNull();
    }
  });
});
