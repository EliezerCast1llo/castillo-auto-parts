import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentResult,
  PaymentProvider,
  PaymentStatus,
  PaymentWebhookEvent,
} from "./provider";

const DEFAULT_API_BASE_URL = "https://api.wompi.sv";
const DEFAULT_IDENTITY_BASE_URL = "https://id.wompi.sv";
const REQUEST_TIMEOUT_MS = 10_000;
const TOKEN_EXPIRY_SAFETY_MS = 30_000;

export type WompiEnvironment = "sandbox" | "production";

export type WompiConfig = {
  apiBaseUrl: string;
  appId: string;
  apiSecret: string;
  environment: WompiEnvironment;
  identityBaseUrl: string;
  webhookSecret: string;
  webhookUrl: string;
};

type Fetch = typeof fetch;

export class InvalidWompiWebhookSignatureError extends Error {
  constructor() {
    super("Invalid Wompi webhook signature.");
  }
}

export function createWompiPaymentProvider(
  config: WompiConfig,
  fetchImplementation: Fetch = fetch,
): PaymentProvider {
  let cachedToken: { accessToken: string; expiresAt: number } | undefined;

  return {
    id: "wompi",

    async createPayment(input): Promise<CreatePaymentResult> {
      const accessToken = await getAccessToken();
      const response = await fetchImplementation(joinUrl(config.apiBaseUrl, "/EnlacePago"), {
        body: JSON.stringify({
          configuracion: {
            cantidadPorDefecto: 1,
            duracionInterfazIntentoMinutos: 20,
            esCantidadEditable: false,
            esMontoEditable: false,
            notificarTransaccionCliente: true,
            urlRedirect: input.redirectUrl,
            urlRetorno: input.redirectUrl,
            urlWebhook: config.webhookUrl,
          },
          formaPago: {
            permitePagoQuickPay: false,
            permitirPagoConPuntoAgricola: false,
            permitirPagoEnBitcoin: false,
            permitirPagoEnCuotasAgricola: false,
            permitirTarjetaCreditoDebido: true,
          },
          identificadorEnlaceComercio: input.orderNumber,
          limitesDeUso: {
            cantidadMaximaPagosExitosos: 1,
            cantidadMaximaPagosFallidos: 3,
          },
          monto: centsToAmount(input.amountCents),
          nombreProducto: `Orden ${input.orderNumber}`,
        }),
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const payload = await readJsonResponse(response, "create payment link");
      const idEnlace = numberOrString(payload.idEnlace);
      const checkoutUrl = stringValue(payload.urlEnlace);
      const isProduction = booleanValue(payload.estaProductivo);

      if (!idEnlace || !checkoutUrl || isProduction === undefined) {
        throw new Error("Wompi returned an incomplete payment-link response.");
      }
      if (isProduction !== (config.environment === "production")) {
        throw new Error("Wompi payment-link environment does not match configuration.");
      }

      return {
        checkoutUrl,
        externalPaymentId: idEnlace,
        externalReference: input.orderNumber,
        provider: "wompi",
        rawPayload: payload,
        rawStatus: isProduction ? "PRODUCTION_LINK_CREATED" : "SANDBOX_LINK_CREATED",
        status: "PENDING",
      };
    },

    async verifyWebhook(request): Promise<PaymentWebhookEvent> {
      const rawBody = await request.text();
      const signature = request.headers.get("wompi_hash");
      if (!verifyWompiWebhookSignature(rawBody, signature, config.webhookSecret)) {
        throw new InvalidWompiWebhookSignatureError();
      }

      const payload = parseJsonRecord(rawBody);
      const paymentLink = recordValue(payload.EnlacePago);
      const result = stringValue(payload.ResultadoTransaccion);
      const eventId = stringValue(payload.IdIntentoPago);
      const externalPaymentId = numberOrString(paymentLink?.Id);
      const externalReference = stringValue(paymentLink?.IdentificadorEnlaceComercio);
      const amountCents = amountToCents(payload.Monto);
      const isProduction = booleanValue(payload.EsProductiva);
      const occurredAt = dateValue(payload.FechaTransaccion);
      const status = mapWompiStatus(result);

      return {
        amountCents,
        eventType: "wompi.payment.received",
        externalEventId: eventId,
        externalPaymentId: externalPaymentId ?? "",
        externalReference,
        isProduction,
        isValid: Boolean(
          eventId &&
            externalPaymentId &&
            externalReference &&
            amountCents !== undefined &&
            isProduction !== undefined &&
            status,
        ),
        occurredAt,
        provider: "wompi",
        rawPayload: payload,
        status: status ?? "FAILED",
      };
    },
  };

  async function getAccessToken() {
    if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_EXPIRY_SAFETY_MS) {
      return cachedToken.accessToken;
    }

    const body = new URLSearchParams({
      audience: "wompi_api",
      client_id: config.appId,
      client_secret: config.apiSecret,
      grant_type: "client_credentials",
    });
    const response = await fetchImplementation(
      joinUrl(config.identityBaseUrl, "/connect/token"),
      {
        body,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    const payload = await readJsonResponse(response, "authenticate");
    const accessToken = stringValue(payload.access_token);
    const expiresIn = numberValue(payload.expires_in);
    if (!accessToken || !expiresIn || expiresIn <= 0) {
      throw new Error("Wompi returned an incomplete OAuth response.");
    }

    cachedToken = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return accessToken;
  }
}

export function getWompiConfig(environment: NodeJS.ProcessEnv = process.env): WompiConfig {
  const wompiEnvironment = environment.WOMPI_ENVIRONMENT?.trim();
  if (wompiEnvironment !== "sandbox" && wompiEnvironment !== "production") {
    throw new Error('WOMPI_ENVIRONMENT must be "sandbox" or "production".');
  }

  return {
    apiBaseUrl: environment.WOMPI_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
    appId: requiredEnvironmentValue(environment, "WOMPI_APP_ID"),
    apiSecret: requiredEnvironmentValue(environment, "WOMPI_API_SECRET"),
    environment: wompiEnvironment,
    identityBaseUrl:
      environment.WOMPI_IDENTITY_BASE_URL?.trim() || DEFAULT_IDENTITY_BASE_URL,
    webhookSecret:
      environment.WOMPI_WEBHOOK_SECRET?.trim() ||
      requiredEnvironmentValue(environment, "WOMPI_API_SECRET"),
    webhookUrl: requiredHttpsUrl(
      requiredEnvironmentValue(environment, "WOMPI_WEBHOOK_URL"),
      "WOMPI_WEBHOOK_URL",
      wompiEnvironment,
    ),
  };
}

export function verifyWompiWebhookSignature(
  rawBody: string,
  providedSignature: string | null,
  secret: string,
) {
  if (!providedSignature || !/^[a-fA-F0-9]{64}$/.test(providedSignature)) return false;

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(providedSignature, "hex");
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

function requiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required when Wompi is enabled.`);
  return value;
}

function requiredHttpsUrl(value: string, name: string, environment: WompiEnvironment) {
  const url = new URL(value);
  if (environment === "production" && url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS in production.`);
  }
  return url.toString();
}

function joinUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

async function readJsonResponse(response: Response, operation: string) {
  const text = await response.text();
  const payload = parseJsonRecord(text);
  if (!response.ok) {
    throw new Error(`Wompi could not ${operation} (HTTP ${response.status}).`);
  }
  return payload;
}

function parseJsonRecord(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // The caller reports a provider-level error without exposing response data.
  }
  throw new Error("Wompi returned invalid JSON.");
}

function mapWompiStatus(value: string | undefined): PaymentStatus | undefined {
  if (!value) return undefined;
  if (value === "ExitosaAprobada") return "PAID";
  return "FAILED";
}

function centsToAmount(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function amountToCents(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return Math.round(amount * 100);
}

function dateValue(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function recordValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numberOrString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return stringValue(value);
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
