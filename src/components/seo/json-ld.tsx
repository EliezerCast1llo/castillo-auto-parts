import type { Thing, WithContext } from "./schema-types";

/**
 * Inserta datos estructurados schema.org como <script type="application/ld+json">.
 *
 * Los scripts de tipo no ejecutable no están sujetos a la directiva script-src
 * de la CSP (no se ejecutan), por lo que no necesitan nonce.
 *
 * Se escapa "<" para impedir inyección de "</script>" si algún dato viniera
 * de contenido editable (nombres de producto, etc.).
 */
export function JsonLd({ data }: { data: WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
