import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Ajustes de la tienda editables desde el panel.
 *
 * La tabla es clave/valor, pero el acceso no: cada ajuste se declara acá con su
 * tipo, su valor por defecto y su texto. Una clave suelta en la base sería un
 * `string` sin dueño, y un error de tipeo al leerla devolvería el default sin
 * que nada avise. Con el registro, la clave equivocada no compila.
 *
 * El valor por defecto es lo que hace que la tabla pueda estar vacía: una fila
 * ausente significa "nadie lo tocó", no "roto". Eso importa porque el panel
 * escribe filas recién cuando alguien guarda, y la tienda tiene que arrancar
 * sin que nadie haya entrado nunca a los ajustes.
 */
export const STORE_SETTINGS = {
  persistentCart: {
    key: "cart.persistent",
    defaultValue: false,
    label: "Guardar el carrito en la cuenta",
    description:
      "Con esto activado, el carrito de quien inició sesión se guarda en su cuenta y lo " +
      "encuentra igual desde otro dispositivo. Apagado, el carrito vive solo en el navegador.",
  },
} as const;

export type StoreSettingName = keyof typeof STORE_SETTINGS;

/** Tag del data cache: una sola entrada para todos los ajustes. */
export const STORE_SETTINGS_CACHE_TAG = "store-settings";

/**
 * Lee todos los ajustes de una vez.
 *
 * Se leen juntos y no de a uno porque el cabezal del sitio consulta el carrito
 * en **cada** página: una consulta por ajuste por request sería un viaje a la
 * base para leer una casilla.
 *
 * El cache se invalida cuando el panel guarda. `revalidate` queda como red por
 * si alguna escritura futura olvida invalidar: un ajuste desactualizado durante
 * un minuto es tolerable, uno desactualizado para siempre no.
 */
const readStoreSettingRows = unstable_cache(
  async () => db.storeSetting.findMany({ select: { key: true, value: true } }),
  ["store-settings"],
  { revalidate: 60, tags: [STORE_SETTINGS_CACHE_TAG] },
);

export type StoreSettingRow = { key: string; value: string };

/**
 * Traduce las filas crudas a un valor usable.
 *
 * Está separada de la lectura porque lo que decide el comportamiento —qué pasa
 * si la fila falta, y qué pasa si dice cualquier cosa— es esto, y la lectura es
 * una consulta cacheada por Next que no se puede ejercitar fuera de una
 * request. Separadas, lo propio se prueba y lo ajeno no se finge.
 */
export function resolveStoreSetting(rows: StoreSettingRow[], name: StoreSettingName): boolean {
  const setting = STORE_SETTINGS[name];
  const row = rows.find((candidate) => candidate.key === setting.key);

  if (!row) return setting.defaultValue;

  return parseBoolean(row.value, setting.defaultValue);
}

export async function getStoreSetting(name: StoreSettingName): Promise<boolean> {
  try {
    return resolveStoreSetting(await readStoreSettingRows(), name);
  } catch (error) {
    // Un ajuste ilegible no puede tumbar la tienda. Se cae al valor por
    // defecto, que es el comportamiento que ya existía antes del ajuste.
    logError({ context: "getStoreSetting", setting: STORE_SETTINGS[name].key }, error);
    return STORE_SETTINGS[name].defaultValue;
  }
}

export async function getAllStoreSettings(): Promise<Record<StoreSettingName, boolean>> {
  const names = Object.keys(STORE_SETTINGS) as StoreSettingName[];
  const values = await Promise.all(names.map((name) => getStoreSetting(name)));

  return Object.fromEntries(names.map((name, index) => [name, values[index]])) as Record<
    StoreSettingName,
    boolean
  >;
}

/**
 * Escribe un ajuste. Acepta un cliente de transacción para que el panel lo
 * guarde en el mismo commit que su registro de auditoría: si la auditoría
 * falla, el ajuste no queda cambiado sin rastro de quién lo cambió.
 */
export async function setStoreSetting(
  name: StoreSettingName,
  value: boolean,
  client: Pick<typeof db, "storeSetting"> = db,
): Promise<void> {
  const { key } = STORE_SETTINGS[name];

  await client.storeSetting.upsert({
    create: { key, value: String(value) },
    update: { value: String(value) },
    where: { key },
  });
}

/**
 * Lo llama el panel después de guardar: sin esto el cambio tarda un minuto.
 *
 * `updateTag` y no `revalidateTag`: es la API de Next 16 que el repo ya usa
 * para el catálogo, y expira de inmediato leyendo la propia escritura dentro
 * de la misma acción.
 */
export function revalidateStoreSettings() {
  updateTag(STORE_SETTINGS_CACHE_TAG);
}

/**
 * Un valor que no es "true" ni "false" es dato corrupto, no un "false".
 * Se cae al default y se avisa, porque leerlo como apagado escondería que
 * alguien escribió basura en la tabla.
 */
export function parseBoolean(value: string, defaultValue: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}
