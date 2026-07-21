/**
 * Tipado mínimo para JSON-LD sin depender de schema-dts.
 * Suficiente para los schemas que usa el sitio (Product, BreadcrumbList,
 * Organization, WebSite).
 */

export type Thing = { "@type": string } & Record<string, unknown>;

export type WithContext<T extends Thing> = T & { "@context": "https://schema.org" };

export function withContext<T extends Thing>(thing: T): WithContext<T> {
  return { "@context": "https://schema.org", ...thing };
}
