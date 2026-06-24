import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailProvider } from ".";

describe("email provider selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows console email outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_PROVIDER", "console");

    expect(getEmailProvider().name).toBe("console");
  });

  it("blocks console email in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "console");

    expect(() => getEmailProvider()).toThrow("EMAIL_PROVIDER=console no está permitido");
  });

  it("allows console email in isolated E2E production runs", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_ISOLATED_DATABASE", "true");
    vi.stubEnv("EMAIL_PROVIDER", "console");

    expect(getEmailProvider().name).toBe("console");
  });

  it("fails loudly for unknown providers", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_PROVIDER", "unknown");

    expect(() => getEmailProvider()).toThrow('EMAIL_PROVIDER inválido: unknown');
  });
});
