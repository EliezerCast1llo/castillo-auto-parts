type Environment = Record<string, string | undefined>;

export class AdminSeedConfigurationError extends Error {}

// Public template values are never credentials, even when they exceed 16 characters.
const EXAMPLE_VALUES = new Set([
  "postgresql://postgres:postgres@localhost:5432/castillo_auto_parts",
  "Castillo Auto Parts",
  "http://localhost:3000",
  "https://api.wompi.sv",
  "https://id.wompi.sv",
  "Castillo Auto Parts <no-reply@castilloautoparts.local>",
  "admin@tudominio.com",
]);

export function readAdminSeedCredentials(environment: Environment = process.env) {
  const email = environment.ADMIN_SEED_EMAIL?.trim();
  const password = environment.ADMIN_SEED_PASSWORD?.trim();
  if (environment.NODE_ENV === "production") {
    const errors: string[] = [];
    if (!email) errors.push("ADMIN_SEED_EMAIL: required");
    else if (EXAMPLE_VALUES.has(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("ADMIN_SEED_EMAIL: must be a valid, non-example email");
    }
    if (!password) errors.push("ADMIN_SEED_PASSWORD: required");
    else if (password.length < 16 || EXAMPLE_VALUES.has(password) || /replace[-_ ]with|change[-_ ]me/i.test(password)) {
      errors.push("ADMIN_SEED_PASSWORD: must have at least 16 characters and must not be an example value");
    }
    if (errors.length) throw new AdminSeedConfigurationError(errors.join("\n"));
  }
  return email && password ? { email, password } : null;
}
