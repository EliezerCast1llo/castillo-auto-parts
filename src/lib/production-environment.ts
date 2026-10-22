type Environment = Record<string, string | undefined>;

/** Only the test runner's disposable PostgreSQL schema may use test providers. */
export function isIsolatedE2EEnvironment(environment: Environment = process.env) {
  if (
    environment.E2E_ISOLATED_DATABASE !== "true" ||
    environment.ALLOW_MOCK_PAYMENT_IN_E2E !== "true"
  ) return false;

  try {
    const database = new URL(environment.DATABASE_URL || "");
    const direct = new URL(environment.DIRECT_DATABASE_URL || "");
    const schema = database.searchParams.get("schema") || "";
    return /^postgres(ql)?:$/.test(database.protocol) &&
      /^e2e_[a-z0-9_]+$/.test(schema) &&
      database.toString() === direct.toString();
  } catch {
    return false;
  }
}

/** Validate at server startup. Errors contain variable names, never values. */
export function validateProductionEnvironment(environment: Environment = process.env) {
  if (environment.NODE_ENV !== "production") return;
  const errors: string[] = [];
  const value = (name: string) => environment[name]?.trim() || "";
  const required = (name: string) => {
    if (!value(name)) errors.push(`${name}: required`);
  };
  const secret = (name: string, contents = value(name)) => {
    if (contents.length < 32 || /replace-with|change-me/i.test(contents)) {
      errors.push(`${name}: must be a non-placeholder secret of at least 32 characters`);
    }
  };
  const url = (name: string, protocols: string[]) => {
    try {
      if (!protocols.includes(new URL(value(name)).protocol)) throw new Error();
    } catch {
      errors.push(`${name}: must be a valid ${protocols.join(" or ")} URL`);
    }
  };

  url("DATABASE_URL", ["postgres:", "postgresql:"]);
  url("DIRECT_DATABASE_URL", ["postgres:", "postgresql:"]);
  secret("AUTH_SECRET/NEXTAUTH_SECRET", value("AUTH_SECRET") || value("NEXTAUTH_SECRET"));
  secret("ADMIN_ACCESS_SECRET");
  secret("GUEST_CART_SECRET");
  secret("RESERVATION_CRON_SECRET");
  if (value("GUEST_CART_SECRET") && value("GUEST_CART_SECRET") === value("ADMIN_ACCESS_SECRET")) {
    errors.push("GUEST_CART_SECRET: must differ from ADMIN_ACCESS_SECRET");
  }

  const isolatedE2E = isIsolatedE2EEnvironment(environment);
  if (!isolatedE2E) {
    url("NEXT_PUBLIC_SITE_URL", ["https:"]);
    url("NEXTAUTH_URL", ["https:"]);
    if (value("PAYMENT_PROVIDER") !== "wompi") {
      errors.push("PAYMENT_PROVIDER: must be wompi; mock is forbidden in production");
    } else {
      for (const name of ["WOMPI_APP_ID", "WOMPI_API_SECRET"]) required(name);
      if (value("WOMPI_ENVIRONMENT") !== "production") {
        errors.push("WOMPI_ENVIRONMENT: must be production");
      }
      url("WOMPI_WEBHOOK_URL", ["https:"]);
      for (const name of ["WOMPI_API_BASE_URL", "WOMPI_IDENTITY_BASE_URL"]) {
        if (value(name)) url(name, ["https:"]);
      }
    }
    if (value("EMAIL_PROVIDER").toLowerCase() !== "resend") {
      errors.push("EMAIL_PROVIDER: must be resend; console is forbidden in production");
    } else {
      required("RESEND_API_KEY");
      required("EMAIL_FROM");
    }
    if (value("ALLOW_IN_MEMORY_RATE_LIMIT") !== "true") {
      url("UPSTASH_REDIS_REST_URL", ["https:"]);
      required("UPSTASH_REDIS_REST_TOKEN");
    }
  }

  if (errors.length) throw new Error(`Invalid production configuration:\n- ${errors.join("\n- ")}`);
}
