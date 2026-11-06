import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import {
  createTwoFactorChallenge,
  purgeExpiredTwoFactorChallenges,
  TWO_FACTOR_LIMITS,
  verifyTwoFactorCode,
} from "./two-factor";

/**
 * Estas pruebas tocan base, así que se saltan donde no hay `DATABASE_URL`.
 * Es el mismo criterio del resto de los tests de integración del repo.
 */
const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeWithDb = hasDatabase ? describe : describe.skip;

async function createUser() {
  return db.user.create({
    data: {
      email: `2fa-${randomUUID()}@e2e.castilloautoparts.com`,
      name: "Cliente 2FA",
      twoFactorEnabled: true,
    },
    select: { id: true },
  });
}

describeWithDb("códigos de segundo factor", () => {
  const userIds: string[] = [];

  beforeAll(() => {
    // El HMAC necesita el secreto; en CI puede no estar seteado.
    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      vi.stubEnv("AUTH_SECRET", "test-secret-con-longitud-suficiente-para-hmac");
    }
  });

  afterAll(async () => {
    await db.twoFactorChallenge.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("acepta el código correcto una sola vez", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const { challengeId, code } = await createTwoFactorChallenge(user.id);

    await expect(verifyTwoFactorCode(challengeId, code)).resolves.toEqual({
      ok: true,
      userId: user.id,
    });

    // Un solo uso: el mismo código no vuelve a servir. Sin esto, un código
    // visto en el correo seguiría abriendo sesiones después.
    await expect(verifyTwoFactorCode(challengeId, code)).resolves.toEqual({
      ok: false,
      reason: "consumed",
    });
  });

  it("nunca guarda el código en claro", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const { challengeId, code } = await createTwoFactorChallenge(user.id);
    const stored = await db.twoFactorChallenge.findUniqueOrThrow({ where: { id: challengeId } });

    // Lo que hay en la base es un HMAC: ni el código ni un hash reversible de
    // seis dígitos, que se revertiría con una tabla de un millón de entradas.
    expect(stored.codeHash).not.toBe(code);
    expect(stored.codeHash).not.toContain(code);
  });

  it("corta después de cinco intentos, aunque después llegue el correcto", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const { challengeId, code } = await createTwoFactorChallenge(user.id);
    const wrong = code === "000000" ? "111111" : "000000";

    for (let attempt = 0; attempt < TWO_FACTOR_LIMITS.maxAttempts; attempt += 1) {
      await expect(verifyTwoFactorCode(challengeId, wrong)).resolves.toEqual({
        ok: false,
        reason: "mismatch",
      });
    }

    // Esta es la que importa: el código es el bueno y aun así no entra.
    await expect(verifyTwoFactorCode(challengeId, code)).resolves.toEqual({
      ok: false,
      reason: "too_many_attempts",
    });
  });

  it("rechaza un código vencido", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const { challengeId, code } = await createTwoFactorChallenge(user.id);
    await db.twoFactorChallenge.update({
      data: { expiresAt: new Date(Date.now() - 1000) },
      where: { id: challengeId },
    });

    await expect(verifyTwoFactorCode(challengeId, code)).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("pedir un código nuevo invalida el anterior", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const first = await createTwoFactorChallenge(user.id);
    const second = await createTwoFactorChallenge(user.id);

    // Si el viejo siguiera vivo, cada pedido sumaría otra ventana de cinco
    // intentos sobre la misma cuenta.
    await expect(verifyTwoFactorCode(first.challengeId, first.code)).resolves.toEqual({
      ok: false,
      reason: "consumed",
    });
    await expect(verifyTwoFactorCode(second.challengeId, second.code)).resolves.toEqual({
      ok: true,
      userId: user.id,
    });
  });

  it("un desafío inexistente no revela nada distinto", async () => {
    await expect(verifyTwoFactorCode("inexistente", "123456")).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("el código tiene seis dígitos, con los ceros adelante", async () => {
    const user = await createUser();
    userIds.push(user.id);

    // Veinte muestras: si el relleno faltara, un código con cero inicial
    // saldría corto y el rango real se encogería.
    for (let i = 0; i < 20; i += 1) {
      const { code } = await createTwoFactorChallenge(user.id);
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("purga los vencidos y deja los vivos", async () => {
    const user = await createUser();
    userIds.push(user.id);

    const vencido = await createTwoFactorChallenge(user.id);
    await db.twoFactorChallenge.update({
      data: { expiresAt: new Date(Date.now() - 1000) },
      where: { id: vencido.challengeId },
    });
    const vivo = await createTwoFactorChallenge(user.id);

    await purgeExpiredTwoFactorChallenges();

    expect(await db.twoFactorChallenge.findUnique({ where: { id: vencido.challengeId } })).toBeNull();
    expect(
      await db.twoFactorChallenge.findUnique({ where: { id: vivo.challengeId } }),
    ).not.toBeNull();
  });
});
