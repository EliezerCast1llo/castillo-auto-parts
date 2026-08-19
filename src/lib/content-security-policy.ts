const DEFAULT_WOMPI_API_BASE_URL = "https://api.wompi.sv";
const DEFAULT_WOMPI_IDENTITY_BASE_URL = "https://id.wompi.sv";

type CspEnvironmentKey =
  | "CLOUDFLARE_R2_PUBLIC_URL"
  | "NODE_ENV"
  | "UPSTASH_REDIS_REST_URL"
  | "WOMPI_API_BASE_URL"
  | "WOMPI_IDENTITY_BASE_URL";

type CspEnvironment = Partial<Record<CspEnvironmentKey, string | undefined>>;

export function buildContentSecurityPolicy({
  environment = process.env,
  nonce,
}: {
  environment?: CspEnvironment;
  nonce: string;
}) {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'"]],
    ["script-src", buildScriptSources(environment, nonce)],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["font-src", ["'self'", "data:"]],
    ["img-src", buildImageSources(environment)],
    ["connect-src", buildConnectSources(environment)],
    ["frame-src", ["'self'", "https://www.google.com"]],
    ["worker-src", ["'self'", "blob:"]],
  ];

  // `upgrade-insecure-requests` se retiro por completo, no solo de aqui:
  //
  //   - En una politica report-only el navegador la ignora y ademas registra
  //     un error en consola, asi que donde estaba no protegia nada.
  //   - Emitirla en una politica aplicada aparte si funciona, pero Chrome
  //     reporta entonces un ContentSecurityPolicyIssue en el panel Issues
  //     (verificado: `inspector-issues` de Lighthouse pasaba a fallar 3/3).
  //   - Es redundante en este sitio: en produccion se envia
  //     `Strict-Transport-Security` con `includeSubDomains; preload`, que ya
  //     impide cualquier peticion http:// al dominio, y todos los origenes de
  //     terceros declarados abajo son https:// literales.
  //
  // Si en el futuro se pasa esta politica de report-only a aplicada, la
  // directiva puede volver dentro de ella sin generar el issue.
  return serializeDirectives(directives);
}

function serializeDirectives(directives: Array<[string, string[]]>) {
  return directives
    .map(([directive, values]) => [directive, ...values].join(" "))
    .join("; ");
}

function buildScriptSources(environment: CspEnvironment, nonce: string) {
  return [
    "'self'",
    `'nonce-${nonce}'`,
    ...(environment.NODE_ENV !== "production" ? ["'unsafe-eval'"] : []),
  ];
}

function buildImageSources(environment: CspEnvironment) {
  return uniqueSources([
    "'self'",
    "blob:",
    "data:",
    "https://tile.openstreetmap.org",
    ...(environment.NODE_ENV !== "production" ? ["https://images.unsplash.com"] : []),
    originFromUrl(environment.CLOUDFLARE_R2_PUBLIC_URL),
  ]);
}

function buildConnectSources(environment: CspEnvironment) {
  return uniqueSources([
    "'self'",
    "https://nominatim.openstreetmap.org",
    originFromUrl(environment.UPSTASH_REDIS_REST_URL),
    originFromUrl(environment.WOMPI_API_BASE_URL || DEFAULT_WOMPI_API_BASE_URL),
    originFromUrl(environment.WOMPI_IDENTITY_BASE_URL || DEFAULT_WOMPI_IDENTITY_BASE_URL),
  ]);
}

function originFromUrl(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function uniqueSources(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
