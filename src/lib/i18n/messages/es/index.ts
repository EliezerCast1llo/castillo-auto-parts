import Common from "./common.json";
import Consent from "./consent.json";

/**
 * Catálogo en español. Es la fuente de verdad de los tipos: se escribe primero
 * y siempre está completo, así que `en` se valida contra él en messages.test.ts.
 *
 * Un JSON por namespace, no un archivo gigante: el catálogo va a llegar a más
 * de mil claves y un solo archivo sería irrevisable en PRs y un imán de
 * conflictos de merge.
 */
const messages = {
  Common,
  Consent,
} as const;

export default messages;
