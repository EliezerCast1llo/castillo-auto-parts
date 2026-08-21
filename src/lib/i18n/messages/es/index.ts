import Account from "./account.json";
import Auth from "./auth.json";
import Cart from "./cart.json";
import Catalog from "./catalog.json";
import Checkout from "./checkout.json";
import Common from "./common.json";
import Consent from "./consent.json";
import Email from "./email.json";
import Errors from "./errors.json";
import Footer from "./footer.json";
import Nav from "./nav.json";
import Orders from "./orders.json";
import Product from "./product.json";
import Status from "./status.json";
import VehicleSearch from "./vehicle-search.json";

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
  Auth,
  Cart,
  Catalog,
  Checkout,
  Common,
  Consent,
  Email,
  Errors,
  Footer,
  Nav,
  Orders,
  Product,
  Status,
  VehicleSearch,
} as const;

export default messages;
