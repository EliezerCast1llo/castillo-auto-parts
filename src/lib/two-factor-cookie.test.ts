import { describe, expect, it } from "vitest";
import {
  createPendingTwoFactorToken,
  PENDING_TWO_FACTOR_MAX_AGE_SECONDS,
  verifyPendingTwoFactorToken,
} from "./two-factor-cookie";

const SECRET = "secreto-de-prueba-con-largo-suficiente";
const OTHER_SECRET = "otro-secreto-de-prueba-igual-de-largo";
const PENDING = { challengeId: "chal_abc123", userId: "user_xyz789" };

describe("cookie del desafío pendiente", () => {
  it("devuelve el desafío y la cuenta que se firmaron", () => {
    const token = createPendingTwoFactorToken(SECRET, PENDING);

    expect(verifyPendingTwoFactorToken(token, SECRET)).toEqual(PENDING);
  });

  it("rechaza un token firmado con otro secreto", () => {
    const token = createPendingTwoFactorToken(OTHER_SECRET, PENDING);

    expect(verifyPendingTwoFactorToken(token, SECRET)).toBeNull();
  });

  it("rechaza una cuenta cambiada a mano", () => {
    // Es el ataque que la firma existe para frenar: cambiar el `userId` por el
    // de otra cuenta para que el reenvío le mande códigos a esa bandeja.
    const token = createPendingTwoFactorToken(SECRET, PENDING);
    const tampered = token.replace(PENDING.userId, "user_victima");

    expect(tampered).not.toBe(token);
    expect(verifyPendingTwoFactorToken(tampered, SECRET)).toBeNull();
  });

  it("rechaza un desafío cambiado a mano", () => {
    const token = createPendingTwoFactorToken(SECRET, PENDING);
    const tampered = token.replace(PENDING.challengeId, "chal_ajeno");

    expect(verifyPendingTwoFactorToken(tampered, SECRET)).toBeNull();
  });

  it("rechaza un token vencido aunque la firma sea buena", () => {
    // La ventana se chequea en el servidor además de en la cookie: `maxAge` lo
    // respeta el navegador, y un cliente que no lo respete reusaría el token
    // para siempre.
    const issuedAt = Date.now() - (PENDING_TWO_FACTOR_MAX_AGE_SECONDS + 5) * 1000;
    const token = createPendingTwoFactorToken(SECRET, PENDING, issuedAt);

    expect(verifyPendingTwoFactorToken(token, SECRET, issuedAt)).toEqual(PENDING);
    expect(verifyPendingTwoFactorToken(token, SECRET)).toBeNull();
  });

  it("rechaza un token emitido en el futuro", () => {
    const issuedAt = Date.now() + 10 * 60 * 1000;
    const token = createPendingTwoFactorToken(SECRET, PENDING, issuedAt);

    expect(verifyPendingTwoFactorToken(token, SECRET)).toBeNull();
  });

  it("rechaza basura y vacío sin tirar", () => {
    expect(verifyPendingTwoFactorToken(undefined, SECRET)).toBeNull();
    expect(verifyPendingTwoFactorToken("", SECRET)).toBeNull();
    expect(verifyPendingTwoFactorToken("v1.abc", SECRET)).toBeNull();
    expect(verifyPendingTwoFactorToken(createPendingTwoFactorToken(SECRET, PENDING), "")).toBeNull();
  });

  it("no acepta un token de otra versión", () => {
    const token = createPendingTwoFactorToken(SECRET, PENDING);

    expect(verifyPendingTwoFactorToken(`v2${token.slice(2)}`, SECRET)).toBeNull();
  });
});
