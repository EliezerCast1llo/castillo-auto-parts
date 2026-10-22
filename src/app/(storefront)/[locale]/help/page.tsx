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
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
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
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <HelpHero t={t} />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Las opciones de entrega montan sobre el hero: cierran el bloque navy
            en lugar de dejar un corte plano entre las dos superficies. */}
        <section
          aria-label={t("delivery.ariaLabel")}
          className="relative z-10 -mt-16 grid gap-4 md:grid-cols-2"
        >
          {deliveryOptions.map((option) => (
            <div
              className={cn(
                cardVariants({ padding: "md" }),
                "flex items-center gap-3 transition-colors hover:border-ca-navy-950/30",
              )}
              key={option.key}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-background text-ca-blue-700">
                <option.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <p className="text-sm font-bold leading-5 text-ca-navy-950">{t(`delivery.${option.key}`)}</p>
            </div>
          ))}
        </section>

        <ProcessSection t={t} />

        <FaqSection t={t} />

        <PolicyNote t={t} />

        <ClosingCta t={t} />
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HelpHero({ t }: { t: HelpTranslator }) {
  return (
    <section className="ca-noise relative overflow-hidden bg-ca-navy-950 text-white">
      {/* Textura y halos: mismo tratamiento que el hero del home para que las
          dos superficies navy del sitio se lean como la misma marca. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ca-grid-bg absolute inset-0" />
        <div className="absolute -right-28 -top-40 h-[460px] w-[460px] rounded-full bg-ca-blue-700/20 blur-[90px]" />
        <div className="absolute -bottom-32 -left-24 h-[320px] w-[420px] rounded-full bg-ca-gold-500/10 blur-[70px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="ca-section-label animate-fade-up">
              <span className="h-px w-6 bg-ca-gold-400" />
              {t("hero.eyebrow")}
            </p>

            <h1 className="animate-fade-up delay-100 mt-4 max-w-xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              {t("hero.titleBefore")}{" "}
              <span className="ca-gold-shimmer">{t("hero.titleHighlight")}</span>{" "}
              {t("hero.titleAfter")}
            </h1>

            <p className="animate-fade-up delay-200 mt-5 max-w-xl text-base leading-7 text-white/75">
              {t("hero.description")}
            </p>

            <div className="animate-fade-up delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppCTA label={t("hero.whatsapp")} phone={SUPPORT_WHATSAPP_NUMBER} />
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-ca-control border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:border-white/35 hover:bg-white/[0.18]"
                href="/catalog"
              >
                {t("hero.browseCatalog")}
              </Link>
            </div>
          </div>

          {/* Panel de datos: la pregunta "¿qué te mando?" resuelta como lista
              numerada en vez de un párrafo dentro del texto de apoyo. */}
          <div className="animate-fade-up delay-300 relative overflow-hidden rounded-ca-surface border border-white/[0.09] bg-ca-navy-900/80 p-6 backdrop-blur-sm sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_-10%,rgba(18,103,197,0.28),transparent_22rem)]" />

            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ca-gold-400">
                {t("intake.eyebrow")}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-tight">
                {t("intake.title")}
              </h2>

              <ol className="mt-6 space-y-3">
                {requestChecklist.map((item, index) => (
                  <li
                    className="flex items-start gap-3 rounded-ca-control border border-white/[0.07] bg-white/[0.04] p-3 transition hover:border-ca-gold-400/30 hover:bg-white/[0.07]"
                    key={item.key}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ca-control border border-ca-gold-400/20 bg-ca-gold-400/10 text-ca-gold-400">
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </span>
                    <p className="pt-1.5 text-sm font-bold leading-5">
                      <span className="mr-2 text-ca-gold-400">{index + 1}.</span>
                      {t(`intake.${item.key}`)}
                    </p>
                  </li>
                ))}
              </ol>

              <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-6 text-white/75">
                {t("intake.note")}
              </p>
            </div>
          </div>
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
          <p className="ca-section-label">
            <span className="h-px w-6 bg-ca-gold-400" />
            {t("steps.eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-ca-navy-950 sm:text-[28px]">
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
              "transition-colors hover:border-ca-navy-950/30",
            )}
            key={step.number}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-ca-control bg-ca-background text-sm font-black tracking-[0.08em] text-ca-blue-700">
              {step.number}
            </span>
            <h3 className="mt-4 text-base font-bold text-ca-navy-950">{t(`steps.${step.key}Title`)}</h3>
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
        <h2 className="text-2xl font-black leading-tight tracking-tight text-ca-navy-950 sm:text-[28px]">
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
              "group transition-colors hover:border-ca-navy-950/30 open:border-ca-navy-950/30",
            )}
            key={faq}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-ca-surface p-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ca-blue-700 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-bold leading-6 text-ca-navy-950">
                {t(`faq.${faq}Question`)}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ca-control border border-ca-border bg-ca-background text-ca-navy-950 transition group-open:border-ca-navy-950 group-open:bg-ca-navy-950 group-open:text-white">
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
            "flex flex-col gap-4 border-dashed bg-ca-background sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <p className="text-sm font-bold text-ca-navy-950">{t("faq.ctaTitle")}</p>
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-background text-ca-text-secondary">
        <RotateCcw className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <div>
        <h2 className="text-base font-bold text-ca-navy-950">{t("policyTitle")}</h2>
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
    <section className="ca-noise relative mt-4 overflow-hidden rounded-ca-surface bg-ca-navy-950 px-6 py-8 text-white sm:px-8">
      <div className="ca-grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ca-blue-700/20 blur-[70px]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            {t("closing.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
            {t("closing.description")}
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "accent", size: "lg" }), "shrink-0")}
          href="/catalog"
        >
          {t("closing.action")}
        </Link>
      </div>
    </section>
  );
}
