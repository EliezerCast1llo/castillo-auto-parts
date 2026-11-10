import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import {
  Camera,
  Car,
  ChevronDown,
  Gauge,
  MapPin,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { localizedAlternates } from "@/lib/i18n/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Help" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: localizedAlternates("/help", locale),
  };
}

type HelpTranslator = Awaited<ReturnType<typeof getTranslations<"Help">>>;

/**
 * Datos que pedimos por WhatsApp. Van en el hero y no en un párrafo porque
 * son la acción real de esta página: mientras más completo llegue el mensaje,
 * menos ida y vuelta hace falta para confirmar compatibilidad.
 */
const requestChecklist = [
  { icon: Car, key: "vehicle" },
  { icon: Gauge, key: "engine" },
  { icon: Camera, key: "photo" },
] as const;

const deliveryOptions = [
  { icon: MapPin, key: "local" },
  { icon: PackageCheck, key: "pickup" },
] as const;

/**
 * El número y el icono se quedan —son presentación—; el texto se resuelve al
 * mostrarlo. Es el mismo criterio del resto del storefront: la lista decide
 * qué pasos hay, no cómo se escriben.
 */
const processSteps = [
  { number: "01", key: "tellUs" },
  { number: "02", key: "verify" },
  { number: "03", key: "choose" },
] as const;

const faqs = [
  "compatibility",
  "pickup",
  "delivery",
  "tax",
  "notFound",
] as const;

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Help" });

  return (
    <main className="min-h-screen bg-ca-surface text-ca-text">
      <SiteHeader locale={locale} activeNav="help" />

      <HelpHero t={t} />

      <div className="ca-container py-8 sm:py-12">
        <section
          aria-label={t("delivery.ariaLabel")}
          className="grid gap-4 md:grid-cols-2"
        >
          {deliveryOptions.map((option) => (
            <div
              className={cn(
                cardVariants({ padding: "md" }),
                "flex items-center gap-3 transition-colors hover:border-ca-navy/30",
              )}
              key={option.key}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy-hover">
                <option.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <p className="text-sm leading-6 text-ca-text">{t(`delivery.${option.key}`)}</p>
            </div>
          ))}
        </section>

        <ProcessSection t={t} />

        <FaqSection t={t} />

        <PolicyNote t={t} />

        <ClosingCta t={t} />
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HelpHero({ t }: { t: HelpTranslator }) {
  return (
    <section className="ca-on-navy bg-ca-navy text-white">
      <div className="ca-container grid items-start gap-8 py-8 sm:py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold text-white/80">{t("hero.eyebrow")}</p>
          <span aria-hidden="true" className="mt-4 block h-0.5 w-12 bg-ca-accent" />
          <h1 className="mt-3 max-w-xl text-4xl font-bold leading-none sm:text-5xl">
            {t("hero.titleBefore")} <span className="text-ca-accent">{t("hero.titleHighlight")}</span> {t("hero.titleAfter")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-6 text-white/90">
            {t("hero.description")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <WhatsAppCTA
              label={t("hero.whatsapp")}
              phone={SUPPORT_WHATSAPP_NUMBER}
              className={SUPPORT_WHATSAPP_NUMBER ? undefined : "border-white/50 hover:border-white"}
            />
            <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="/catalog">
              {t("hero.browseCatalog")}
            </Link>
          </div>
        </div>

        <div className={cardVariants({ padding: "lg", className: "text-ca-text" })}>
          <p className="text-sm font-semibold text-ca-text-secondary">{t("intake.eyebrow")}</p>
          <h2 className="mt-2 text-xl font-bold text-ca-navy">{t("intake.title")}</h2>
          <ul className="mt-4 divide-y divide-ca-border">
            {requestChecklist.map(({ icon: Icon, key }) => (
              <li className="flex items-center gap-3 py-3 text-sm text-ca-text" key={key}>
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-ca-navy" />
                {t(`intake.${key}`)}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-ca-border pt-4 text-sm leading-6 text-ca-text-secondary">
            {t("intake.note")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compra asistida
// ---------------------------------------------------------------------------

function ProcessSection({ t }: { t: HelpTranslator }) {
  return (
    <section className="mt-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ca-text-secondary">
            {t("steps.eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ca-navy sm:text-ca-title">
            {t("steps.title")}
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-ca-text-secondary">
          {t("steps.description")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {processSteps.map((step) => (
          <article
            className={cn(
              cardVariants({ padding: "lg" }),
              "transition-colors hover:border-ca-navy/30",
            )}
            key={step.number}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-ca-control bg-ca-bg text-sm font-bold text-ca-navy-hover">
              {step.number}
            </span>
            <h3 className="mt-4 text-base font-bold text-ca-navy">{t(`steps.${step.key}Title`)}</h3>
            <p className="mt-2 text-sm leading-6 text-ca-text-secondary">
              {t(`steps.${step.key}Description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Preguntas frecuentes
// ---------------------------------------------------------------------------

function FaqSection({ t }: { t: HelpTranslator }) {
  return (
    <section className="mt-14 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-10">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-ca-navy sm:text-ca-title">
          {t("faq.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ca-text-secondary">
          {t("faq.description")}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            className={cn(
              cardVariants({ padding: "none" }),
              "group transition-colors hover:border-ca-navy/30 open:border-ca-navy/30",
            )}
            key={faq}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-ca-surface p-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ca-navy-hover [&::-webkit-details-marker]:hidden">
              <span className="text-base font-bold leading-6 text-ca-navy">
                {t(`faq.${faq}Question`)}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ca-control border border-ca-border bg-ca-bg text-ca-navy transition group-open:border-ca-navy group-open:bg-ca-navy group-open:text-white">
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                  strokeWidth={2.2}
                />
              </span>
            </summary>
            <p className="border-t border-ca-border px-5 py-4 text-sm leading-6 text-ca-text-secondary">
              {t(`faq.${faq}Answer`)}
            </p>
          </details>
        ))}

        {/* La salida a WhatsApp va al final de la lista, no al lado: recién
            después de leer las cinco preguntas se sabe que ninguna aplica.
            Peso visual bajo a propósito, para no competir con el CTA del hero. */}
        <div
          className={cn(
            cardVariants({ padding: "md" }),
            "flex flex-col gap-4 border-dashed bg-ca-bg sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-sm font-bold text-ca-navy">{t("faq.ctaTitle")}</p>
            <p className="mt-1 text-sm leading-6 text-ca-text-secondary">
              {t("faq.ctaText")}
            </p>
          </div>
          <WhatsAppCTA
            className="shrink-0"
            label={t("faq.ctaLabel")}
            phone={SUPPORT_WHATSAPP_NUMBER}
            variant="subtle"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Nota de políticas
// ---------------------------------------------------------------------------

/**
 * Las condiciones comerciales siguen sin definirse. Se muestran como nota y no
 * como beneficio: la página no debe prometer condiciones que todavía no están
 * aprobadas para producción.
 */
function PolicyNote({ t }: { t: HelpTranslator }) {
  return (
    <section className={cn(cardVariants({ padding: "lg" }), "mt-12 flex items-start gap-4")}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-text-secondary">
        <RotateCcw className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <div>
        <h2 className="text-base font-bold text-ca-navy">{t("policyTitle")}</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ca-text-secondary">
          {t("policyNote")}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cierre
// ---------------------------------------------------------------------------

function ClosingCta({ t }: { t: HelpTranslator }) {
  return (
    <section className={cn(cardVariants({ padding: "lg" }), "mt-4")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t("closing.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ca-text-secondary">
            {t("closing.description")}
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
          href="/catalog"
        >
          {t("closing.action")}
        </Link>
      </div>
    </section>
  );
}
