import { NextResponse, type NextRequest } from "next/server";

/**
 * Composición del ruteo de idiomas con el middleware que ya existía.
 *
 * `createMiddleware` de next-intl construye su propio `NextResponse` y no
 * expone ningún hook para inyectarle nuestros headers de request. Codifica su
 * intención en headers de respuesta:
 *
 *   - `location` → quiere redirigir
 *   - `x-middleware-rewrite` → quiere reescribir
 *   - ninguno de los dos → deja pasar
 *
 * Eso importa porque **Next lee `content-security-policy` de los headers de la
 * request** para ponerle nonce a sus propios `<script>` de bootstrap. Si se
 * devuelve la respuesta de next-intl tal cual en los casos de rewrite y
 * passthrough, esos scripts quedan sin nonce y la CSP los bloquea apenas se
 * ponga `CSP_ENFORCE=true`. Por eso re-emitimos nuestra propia respuesta y le
 * copiamos lo que next-intl haya adjuntado.
 *
 * `x-middleware-rewrite` es contrato interno de Next, no API pública. Está
 * cubierto por un canario e2e que compara el nonce del header con el del HTML.
 */

/** Headers que next-intl adjunta y que no podemos perder al re-emitir. */
const HEADERS_TO_CARRY_OVER = ["link", "vary"] as const;

export function isRedirectResponse(response: Response): boolean {
  return response.headers.has("location");
}

/**
 * Marca una respuesta cuyo destino depende de la negociación de idioma.
 *
 * El redirect de `/` elige `/es` o `/en` según `Accept-Language` y la cookie de
 * idioma, pero next-intl no lo declara. Sin `Vary`, un CDN o un proxy cachea la
 * respuesta por URL y le sirve el idioma equivocado al siguiente visitante.
 */
export function markAsLocaleNegotiated<T extends Response>(response: T): T {
  const existing = response.headers.get("vary");
  const values = new Set(
    (existing ? existing.split(",") : []).map((value) => value.trim()).filter(Boolean),
  );

  values.add("Accept-Language");
  values.add("Cookie");
  response.headers.set("vary", [...values].join(", "));

  return response;
}

export function getRewriteTarget(response: Response): string | null {
  return response.headers.get("x-middleware-rewrite");
}

/**
 * Copia de la respuesta de next-intl lo que debe sobrevivir:
 *
 * - `set-cookie`: la cookie de idioma, que puede venir más de una vez y por eso
 *   se lee con `getSetCookie()` y se agrega, no se sobrescribe.
 * - `link`: los `rel="alternate"` con `hreflang` que ven los buscadores.
 * - `vary`: `accept-language`, sin el cual un CDN serviría el idioma cruzado.
 */
export function carryOverIntlHeaders(from: Response, to: NextResponse): NextResponse {
  for (const cookie of from.headers.getSetCookie()) {
    to.headers.append("set-cookie", cookie);
  }

  for (const header of HEADERS_TO_CARRY_OVER) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }

  return to;
}

/**
 * Re-emite la respuesta de next-intl como una propia que sí forwardea los
 * headers de request, preservando su intención de rewrite o passthrough.
 *
 * Los redirects no pasan por acá: no renderizan HTML, así que no necesitan que
 * se forwardee nada.
 */
export function reissueIntlResponse(
  intlResponse: Response,
  request: NextRequest,
  requestHeaders: Headers,
): NextResponse {
  const rewriteTarget = getRewriteTarget(intlResponse);

  const response = rewriteTarget
    ? NextResponse.rewrite(new URL(rewriteTarget, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } });

  return carryOverIntlHeaders(intlResponse, response);
}
