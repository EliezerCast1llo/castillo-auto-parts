import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  parseBoolean,
  resolveStoreSetting,
  setStoreSetting,
  STORE_SETTINGS,
  type StoreSettingRow,
} from "./store-settings";

const KEY = STORE_SETTINGS.persistentCart.key;
const DEFAULT = STORE_SETTINGS.persistentCart.defaultValue;

describe("resolución de ajustes", () => {
  it("usa el valor por defecto cuando la fila no existe", () => {
    // Es lo que permite que la tabla esté vacía: el panel escribe filas recién
    // cuando alguien guarda, y la tienda tiene que arrancar antes de eso.
    expect(resolveStoreSetting([], "persistentCart")).toBe(DEFAULT);
  });

  it("ignora las filas de otras claves", () => {
    const rows: StoreSettingRow[] = [{ key: "otra.cosa", value: String(!DEFAULT) }];

    expect(resolveStoreSetting(rows, "persistentCart")).toBe(DEFAULT);
  });

  it("devuelve lo que dice la fila", () => {
    expect(resolveStoreSetting([{ key: KEY, value: "true" }], "persistentCart")).toBe(true);
    expect(resolveStoreSetting([{ key: KEY, value: "false" }], "persistentCart")).toBe(false);
  });

  it("cae al valor por defecto si la fila dice basura", () => {
    // Leer basura como "apagado" escondería que alguien escribió cualquier cosa
    // en la tabla; el default al menos deja el comportamiento conocido.
    expect(resolveStoreSetting([{ key: KEY, value: "quizás" }], "persistentCart")).toBe(DEFAULT);
    expect(resolveStoreSetting([{ key: KEY, value: "1" }], "persistentCart")).toBe(DEFAULT);
    expect(resolveStoreSetting([{ key: KEY, value: "" }], "persistentCart")).toBe(DEFAULT);
  });

  it("solo 'true' y 'false' son valores válidos", () => {
    expect(parseBoolean("true", false)).toBe(true);
    expect(parseBoolean("false", true)).toBe(false);
    expect(parseBoolean("TRUE", false)).toBe(false);
  });

  it("el carrito persistente viene apagado de fábrica", () => {
    // Encenderlo cambia dónde vive el carrito de toda la tienda. Esa decisión
    // la toma el panel, no un despliegue, así que el valor de fábrica es el
    // comportamiento que ya existía.
    expect(DEFAULT).toBe(false);
  });
});

/** Toca base, así que se salta donde no hay `DATABASE_URL`, como el resto. */
const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("escritura de ajustes", () => {
  afterEach(async () => {
    await db.storeSetting.deleteMany({ where: { key: KEY } });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("guarda bajo la clave del registro y se puede releer", async () => {
    await setStoreSetting("persistentCart", true);

    const row = await db.storeSetting.findUnique({ where: { key: KEY } });
    expect(row?.value).toBe("true");
    expect(resolveStoreSetting([row!], "persistentCart")).toBe(true);
  });

  it("guardar dos veces actualiza la misma fila, no agrega otra", async () => {
    await setStoreSetting("persistentCart", true);
    await setStoreSetting("persistentCart", false);

    const rows = await db.storeSetting.findMany({ where: { key: KEY } });
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe("false");
  });
});
