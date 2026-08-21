import Account from "./account.json";
import Cart from "./cart.json";
import Catalog from "./catalog.json";
import Checkout from "./checkout.json";
import Common from "./common.json";
import Consent from "./consent.json";
import Email from "./email.json";
import Errors from "./errors.json";
import Nav from "./nav.json";
import Orders from "./orders.json";
import Status from "./status.json";

/**
 * Catálogo en español. Es la fuente de verdad de los tipos: se escribe primero
 * y siempre está completo, así que `en` se valida contra él en messages.test.ts.
 *
 * Un JSON por namespace, no un archivo gigante: el catálogo va a llegar a más
 * de mil claves y un solo archivo sería irrevisable en PRs y un imán de
 * conflictos de merge.
 */
const messages = {
  Account,
  Cart,
  Catalog,
  Checkout,
  Common,
  Consent,
  Email,
  Errors,
  Nav,
  Orders,
  Status,
} as const;

export default messages;
