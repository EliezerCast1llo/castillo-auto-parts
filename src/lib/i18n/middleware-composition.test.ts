import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  carryOverIntlHeaders,
  getRewriteTarget,
  isRedirectResponse,
  markAsLocaleNegotiated,
} from "./middleware-composition";

describe("isRedirectResponse", () => {
  it("detects a redirect by its Location header", () => {
    expect(isRedirectResponse(new Response(null, { headers: { location: "/es" } }))).toBe(true);
    expect(isRedirectResponse(new Response(null))).toBe(false);
  });
});

describe("getRewriteTarget", () => {
  it("reads the internal rewrite header next-intl sets", () => {
    const rewrite = new Response(null, {
      headers: { "x-middleware-rewrite": "https://example.com/es/catalog" },
    });

    expect(getRewriteTarget(rewrite)).toBe("https://example.com/es/catalog");
    expect(getRewriteTarget(new Response(null))).toBeNull();
  });
});

describe("carryOverIntlHeaders", () => {
  it("carries every Set-Cookie, not just the first one", () => {
    const from = new Response(null);
    from.headers.append("set-cookie", "castillo_locale=en; Path=/");
    from.headers.append("set-cookie", "other=1; Path=/");

    const to = carryOverIntlHeaders(from, NextResponse.next());

    expect(to.headers.getSetCookie()).toEqual([
      "castillo_locale=en; Path=/",
      "other=1; Path=/",
    ]);
  });

  it("carries the alternate links so search engines find the other language", () => {
    const from = new Response(null, {
      headers: { link: '<https://x.com/en>; rel="alternate"; hreflang="en"' },
    });

    const to = carryOverIntlHeaders(from, NextResponse.next());

    expect(to.headers.get("link")).toBe('<https://x.com/en>; rel="alternate"; hreflang="en"');
  });

  it("carries Vary so a CDN does not serve the wrong language", () => {
    const from = new Response(null, { headers: { vary: "accept-language" } });

    expect(carryOverIntlHeaders(from, NextResponse.next()).headers.get("vary")).toBe(
      "accept-language",
    );
  });

  it("leaves the response untouched when next-intl attached nothing", () => {
    const to = carryOverIntlHeaders(new Response(null), NextResponse.next());

    expect(to.headers.get("link")).toBeNull();
    expect(to.headers.getSetCookie()).toEqual([]);
  });

  it("does not copy the internal rewrite header onto the reissued response", () => {
    const from = new Response(null, {
      headers: { "x-middleware-rewrite": "https://example.com/es" },
    });

    const to = carryOverIntlHeaders(from, NextResponse.next());

    // La reescritura la aplica NextResponse.rewrite; copiar el header ademas
    // haria que Next la procese dos veces.
    expect(to.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("markAsLocaleNegotiated", () => {
  it("declares that the response depends on the language negotiation", () => {
    const response = markAsLocaleNegotiated(new Response(null, { headers: { location: "/en" } }));

    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
  });

  it("keeps whatever Vary values were already there", () => {
    const response = markAsLocaleNegotiated(
      new Response(null, { headers: { vary: "Accept-Encoding" } }),
    );

    expect(response.headers.get("vary")).toBe("Accept-Encoding, Accept-Language, Cookie");
  });

  it("does not duplicate values when applied twice", () => {
    const response = markAsLocaleNegotiated(markAsLocaleNegotiated(new Response(null)));

    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
  });
});
