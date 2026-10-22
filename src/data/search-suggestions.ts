/**
 * Atajos que ofrece la pantalla de "sin resultados".
 *
 * Dos cosas distintas, y por eso van separadas:
 *
 * - `key` resuelve el texto visible contra los mensajes, y se traduce.
 * - `query` es lo que se busca, y **no** se traduce: se compara contra el
 *   contenido, que está en español hasta que el producto tenga traducción.
 *
 * La query va en singular. La búsqueda es un `contains` literal, sin
 * lematización, así que "amortiguadores" no encuentra "Amortiguador delantero
 * Toyota Corolla" y "bujías" no encuentra "Bujía iridio". Medido contra el
 * seed: en singular dan 4 y 5 resultados; en plural, cero.
 *
 * La etiqueta sí puede ir en plural, que es como se lee natural.
 *
 * Vive en `src/data` y no en la página porque es dato, y porque así
 * `search-suggestions.test.ts` puede verificar que cada query siga encontrando
 * algo sin levantar un servidor. Un atajo que lleva a cero resultados es peor
 * que no ofrecerlo: el que lo toca ya venía de una búsqueda fallida.
 */
export const SEARCH_SUGGESTIONS = [
  { key: "shocks", query: "amortiguador" },
  { key: "brakePads", query: "pastilla" },
  { key: "oilFilter", query: "filtro de aceite" },
  { key: "sparkPlugs", query: "bujía" },
] as const;

export type SearchSuggestion = (typeof SEARCH_SUGGESTIONS)[number];
