const DEFAULT_WOMPI_API_BASE_URL = "https://api.wompi.sv";
const DEFAULT_WOMPI_IDENTITY_BASE_URL = "https://id.wompi.sv";

type CspEnvironmentKey =
  | "CLOUDFLARE_R2_PUBLIC_URL"
  | "CSP_ENFORCE"
  | "NODE_ENV"
  | "NEXT_PUBLIC_GOOGLE_ADS_ID"
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
    ["frame-src", ["'self'", "https://www.google.com", ...(hasGoogleAds(environment)
      ? ["https://td.doubleclick.net", "https://www.googletagmanager.com"] : [])]],
    ["worker-src", ["'self'", "blob:"]],
  ];

  // El middleware usa el mismo valor para elegir el header aplicado.
  // En report-only el navegador ignora esta directiva y genera un aviso.
  if (environment.CSP_ENFORCE === "true") {
    directives.push(["upgrade-insecure-requests", []]);
  }
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
    ...(hasGoogleAds(environment) ? ["https://www.googletagmanager.com"] : []),
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
    ...(hasGoogleAds(environment) ? [
      "https://www.google.com",
      "https://www.googletagmanager.com",
      "https://googleads.g.doubleclick.net",
      "https://www.google.com.sv",
    ] : []),
  ]);
}

function buildConnectSources(environment: CspEnvironment) {
  return uniqueSources([
    "'self'",
    "https://nominatim.openstreetmap.org",
    originFromUrl(environment.UPSTASH_REDIS_REST_URL),
    originFromUrl(environment.WOMPI_API_BASE_URL || DEFAULT_WOMPI_API_BASE_URL),
    originFromUrl(environment.WOMPI_IDENTITY_BASE_URL || DEFAULT_WOMPI_IDENTITY_BASE_URL),
    ...(hasGoogleAds(environment) ? [
      "https://www.google.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://googleads.g.doubleclick.net",
      "https://www.googleadservices.com",
    ] : []),
  ]);
}

function hasGoogleAds(environment: CspEnvironment) {
  return Boolean(environment.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim());
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
