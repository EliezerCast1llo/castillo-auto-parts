import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hashPassword } from "./admin-credentials";
import { authorizeCustomerPassword, authorizeTwoFactorCode } from "./auth-providers";
import { db } from "./db";
import { createTwoFactorChallenge } from "./two-factor";

/** Tocan base, así que se saltan donde no hay `DATABASE_URL`, como el resto. */
const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeWithDb = hasDatabase ? describe : describe.skip;

const PASSWORD = "Contrasena-de-prueba-1!";

describeWithDb("proveedores de ingreso", () => {
  const userIds: string[] = [];
  let passwordHash = "";

  beforeAll(async () => {
    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      vi.stubEnv("AUTH_SECRET", "test-secret-con-longitud-suficiente-para-hmac");
    }
    passwordHash = await hashPassword(PASSWORD);
  });

  afterAll(async () => {
    await db.twoFactorChallenge.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  async function createUser(
    overrides: { isActive?: boolean; twoFactorEnabled?: boolean; withPassword?: boolean } = {},
  ) {
    const user = await db.user.create({
      data: {
        email: `auth-${randomUUID()}@e2e.castilloautoparts.com`,
        isActive: overrides.isActive ?? true,
        name: "Cliente de prueba",
        passwordHash: overrides.withPassword === false ? null : passwordHash,
        twoFactorEnabled: overrides.twoFactorEnabled ?? false,
      },
      select: { email: true, id: true },
    });

    userIds.push(user.id);
    return user;
  }

  describe("credenciales", () => {
    it("acepta la contraseña correcta cuando la cuenta no tiene segundo factor", async () => {
      const user = await createUser();

      await expect(authorizeCustomerPassword(user.email, PASSWORD)).resolves.toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it("rechaza la contraseña correcta cuando la cuenta tiene segundo factor", async () => {
      const user = await createUser({ twoFactorEnabled: true });

      // Esta es la garantía entera del feature. Auth.js publica el callback de
      // este proveedor como endpoint HTTP, así que sin este rechazo un POST
      // directo con la contraseña correcta abriría sesión sin pedir el código.
      await expect(authorizeCustomerPassword(user.email, PASSWORD)).resolves.toBeNull();
    });

    it("no distingue mayúsculas ni espacios en el correo", async () => {
      const user = await createUser();

      await expect(
        authorizeCustomerPassword(`  ${user.email.toUpperCase()} `, PASSWORD),
      ).resolves.toMatchObject({ id: user.id });
    });

    it("rechaza la contraseña incorrecta", async () => {
      const user = await createUser();

      await expect(authorizeCustomerPassword(user.email, "otra-cosa")).resolves.toBeNull();
    });

    it("rechaza una cuenta desactivada", async () => {
      const user = await createUser({ isActive: false });

      await expect(authorizeCustomerPassword(user.email, PASSWORD)).resolves.toBeNull();
    });

    it("rechaza una cuenta sin contraseña propia", async () => {
      const user = await createUser({ withPassword: false });

      await expect(authorizeCustomerPassword(user.email, PASSWORD)).resolves.toBeNull();
    });

    it("rechaza campos vacíos sin consultar la base", async () => {
      await expect(authorizeCustomerPassword(undefined, PASSWORD)).resolves.toBeNull();
      await expect(authorizeCustomerPassword("alguien@example.com", "")).resolves.toBeNull();
    });
  });

  describe("segundo factor", () => {
    it("abre sesión con el código correcto", async () => {
      const user = await createUser({ twoFactorEnabled: true });
      const { challengeId, code } = await createTwoFactorChallenge(user.id);

      await expect(authorizeTwoFactorCode(challengeId, code)).resolves.toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it("rechaza el código incorrecto", async () => {
      const user = await createUser({ twoFactorEnabled: true });
      const { challengeId, code } = await createTwoFactorChallenge(user.id);
      const wrong = code === "000000" ? "111111" : "000000";

      await expect(authorizeTwoFactorCode(challengeId, wrong)).resolves.toBeNull();
    });

    it("rechaza el código correcto si la cuenta se desactivó mientras esperaba", async () => {
      // El código vive diez minutos; en ese rato la cuenta puede caerse. Si no
      // se releyera al usuario, el desafío viejo seguiría abriendo sesión.
      const user = await createUser({ twoFactorEnabled: true });
      const { challengeId, code } = await createTwoFactorChallenge(user.id);

      await db.user.update({ data: { isActive: false }, where: { id: user.id } });

      await expect(authorizeTwoFactorCode(challengeId, code)).resolves.toBeNull();
    });

    it("rechaza campos vacíos", async () => {
      await expect(authorizeTwoFactorCode(undefined, "123456")).resolves.toBeNull();
      await expect(authorizeTwoFactorCode("chal_x", undefined)).resolves.toBeNull();
    });
  });
});
