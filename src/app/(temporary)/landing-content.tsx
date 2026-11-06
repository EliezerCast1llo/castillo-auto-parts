import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildContactLinks } from "@/lib/contact";
import type { Locale } from "@/lib/i18n/config";
import { landingSiteUrl } from "@/lib/landing-site-url";

/**
 * La landing, en el idioma que le pasen.
 *
 * Las dos rutas —`/` en español y `/en` en inglés— renderizan esto. Son rutas
 * de verdad y no una cookie porque esta página se compila sin estado: no emite
 * cookies, no lleva un solo formulario, y un buscador tiene que poder indexar
 * las dos versiones por separado.
 */

/**
 * Las flechas son SVG propio y no un ícono de librería: en una señal la flecha
 * es parte del sistema, con el mismo grosor de trazo que el resto, no un
 * pictograma prestado.
 */
function SignArrow() {
  return (
    <svg aria-hidden="true" className="sign-arrow" viewBox="0 0 48 24">
      <path d="M2 12h38M30 2l12 10-12 10" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

type LandingContentProps = {
  locale: Locale;
  /** Ruta de la otra versión, para el enlace de idioma. */
  otherHref: string;
  otherLabel: string;
};

export async function LandingContent({ locale, otherHref, otherLabel }: LandingContentProps) {
  const t = await getTranslations({ locale, namespace: "Landing" });
  const contact = buildContactLinks();
  const otherLocale = locale === "es" ? "en" : "es";

  // Las filas son la estructura de la página, no una lista decorativa: cada
  // una dice un destino y **en cuánto** está, porque la distancia que le
  // importa a quien tiene el carro parado es tiempo y no kilómetros.
  //
  // El envío al resto del país no está acá a propósito: depende de la
  // paquetería y no tiene plazo fijo, así que responder con un lugar rompería
  // la gramática de la columna. La cobertura nacional se dice abajo, donde no
  // promete un tiempo que nadie puede sostener.
  const destinations = [
    { id: "pickup", place: t("pickup"), when: t("pickupWhen") },
    { id: "local", place: t("localDelivery"), when: t("localDeliveryWhen") },
  ];

  return (
    <div className="landing-shell">
      {/* El montaje. La placa deja de ser un fondo y pasa a ser un objeto:
          tiene canto, está atornillada, y baja a la carretera por dos postes.
          Es lo que el mundo ya nombraba —«poste galvanizado»— y la página
          nunca había dibujado. */}
      <div className="sign-mount">
        <div aria-hidden="true" className="sign-post sign-post-left" />
        <div aria-hidden="true" className="sign-post sign-post-right" />

        <section className="sign-plate">
          <header className="sign-head">
            {/* El escudo de ruta: la marca ocupa el lugar que en una señal ocupa
                el número de carretera. */}
            <Link className="sign-shield" href="/" prefetch={false}>
              <span className="sign-shield-mark" aria-hidden="true">
                CA
              </span>
              {t("brand")}
            </Link>

            <nav aria-label={t("languageLabel")} className="sign-lang">
              {/* `lang` además de `hrefLang`: el primero dice en qué idioma está
                  **esta** etiqueta, el segundo a qué idioma lleva el enlace. Sin
                  el primero, un lector de pantalla lee "EN" en español. */}
              <Link
                href={otherHref}
                hrefLang={otherLocale}
                lang={otherLocale}
                prefetch={false}
              >
                {otherLabel}
              </Link>
            </nav>
          </header>

          <div className="sign-body">
            <h1 className="sign-legend">{t("title")}</h1>

            <ul aria-label={t("destinationsLabel")} className="sign-destinations">
              {destinations.map((destination) => (
                <li key={destination.id}>
                  <span className="sign-place">{destination.place}</span>
                  <SignArrow />
                  <span className="sign-when">{destination.when}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* La placa de salida: amarillo de advertencia, reservado para esto y
              para nada más en toda la página. */}
          <a
            className="sign-exit"
            href={contact.whatsapp}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="sign-exit-label">{t("exit")}</span>
            <span className="sign-exit-action">{t("whatsapp")}</span>
            <SignArrow />
          </a>
        </section>
      </div>

      <section className="asphalt">
        {/* La franja corre horizontal y escala; nunca se parte en dos renglones. */}
        <div aria-hidden="true" className="asphalt-stripe" />

        <div className="asphalt-facts">
          <p className="asphalt-lead">{t("description")}</p>
          <p>{t("stockFact")}</p>
          <p>{t("askFact")}</p>
        </div>

        <dl className="asphalt-contact">
          <div>
            <dt>{t("phoneLabel")}</dt>
            <dd>
              <a href={contact.telephone}>{contact.displayPhone}</a>
            </dd>
          </div>
          <div>
            <dt>{t("coverageLabel")}</dt>
            <dd>{t("coverage")}</dd>
          </div>
        </dl>
      </section>

      <footer className="landing-footer">
        <p>{t("status")}</p>
        <p>{t("footer")}</p>
      </footer>
    </div>
  );
}

/**
 * Datos estructurados.
 *
 * Es lo que permite que un buscador —y un asistente— entiendan que esto es una
 * tienda de repuestos que atiende El Salvador, en vez de una página suelta.
 *
 * Solo lleva hechos confirmados: nombre, teléfono, zona e idiomas. **Sin**
 * dirección, horario, precios ni reseñas, porque no existen todavía y un dato
 * inventado acá es el que después aparece citado como verdad.
 */
export function LandingStructuredData({ locale, nonce }: { locale: Locale; nonce?: string }) {
  const contact = buildContactLinks();
  const site = landingSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: "Castillo Autoparts",
    url: locale === "es" ? `${site}/` : `${site}/en`,
    telephone: contact.displayPhone,
    areaServed: { "@type": "Country", name: "El Salvador" },
    availableLanguage: ["es", "en"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: contact.displayPhone,
      availableLanguage: ["es", "en"],
    },
  };

  return (
    <script
      // El `<` escapado evita que un valor del entorno cierre la etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      nonce={nonce}
      type="application/ld+json"
    />
  );
}
