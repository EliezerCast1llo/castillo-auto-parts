/**
 * logger.ts — Logger centralizado para errores de servidor.
 *
 * En desarrollo: imprime en consola con contexto.
 * En producción: estructura el error para integrarse con un proveedor externo
 * (Sentry, Datadog, etc.) cuando se configure. Por ahora escribe en consola
 * pero con el formato estructurado listo para ser redirigido.
 *
 * NUNCA loguear: contraseñas, tokens, secretos, datos de tarjeta.
 */

type LogLevel = "error" | "warn" | "info";

type LogContext = {
  context: string;
  userId?: string;
  orderId?: string;
  [key: string]: unknown;
};

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, name: value.name };
  }
  return value;
}

function log(level: LogLevel, context: LogContext, error?: unknown) {
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    ...context,
    ...(error !== undefined ? { error: sanitize(error) } : {}),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else if (level === "warn") {
    console.warn(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

export function logError(context: LogContext, error?: unknown) {
  log("error", context, error);
}

export function logWarn(context: LogContext, error?: unknown) {
  log("warn", context, error);
}

export function logInfo(context: LogContext) {
  log("info", context);
}
