import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  Car,
  ChevronDown,
  Clock,
  Gauge,
  Hash,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ayuda y contacto | Castillo Auto Parts",
  description:
    "Ayuda para comprar repuestos automotrices, validar compatibilidad, retiro en bodega y entregas locales en El Salvador.",
};

/**
 * Datos que pedimos por WhatsApp. Van en el hero y no en un párrafo porque
 * son la acción real de esta página: mientras más completo llegue el mensaje,
 * menos ida y vuelta hace falta para confirmar compatibilidad.
 */
const requestChecklist = [
  {
    icon: Car,
    title: "Marca, modelo y año",
    detail: "Los tres datos base para filtrar compatibilidad.",
  },
  {
    icon: Gauge,
    title: "Motor o versión",
    detail: "Si lo tienes a mano, descarta piezas parecidas.",
  },
  {
    icon: Hash,
    title: "Número de parte o SKU",
    detail: "El camino más rápido y exacto para ubicarla.",
  },
  {
    icon: Camera,
    title: "Foto de la pieza",
    detail: "Sirve cuando no sabes cómo se llama el repuesto.",
  },
];

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Compatibilidad primero",
    detail: "Validamos los datos del vehículo antes de que compres una pieza incorrecta.",
  },
  {
    icon: PackageCheck,
    title: "Retiro en bodega",
    detail: "Sin costo dentro del horario operativo. La dirección aparece en checkout.",
  },
  {
    icon: Truck,
    title: "Entrega local",
    detail: "San Salvador y Santa Tecla. La tarifa se calcula según el municipio.",
  },
];

const faqs = [
  {
    question: "¿Cómo sé si un repuesto es compatible con mi vehículo?",
    answer:
      "Puedes buscar por marca, modelo y año en el catálogo. En la página del producto revisa la sección de compatibilidad y, si tienes duda, envíanos el SKU por WhatsApp para validarlo antes de comprar.",
  },
  {
    question: "¿Puedo retirar mi pedido en bodega?",
    answer:
      "Sí. El retiro en bodega es gratis dentro del horario operativo configurado. La dirección exacta se muestra en checkout cuando eliges retiro.",
  },
  {
    question: "¿Hacen entregas a domicilio?",
    answer:
      "El MVP cubre entregas locales por zona, empezando por San Salvador y Santa Tecla. La tarifa se calcula según el municipio seleccionado.",
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer:
      "Sí. Los precios visibles del producto ya incluyen IVA. En checkout verás productos, envío y total estimado sin desglose adicional de IVA.",
  },
  {
    question: "¿Qué pasa si no encuentro el repuesto?",
    answer:
      "Puedes escribirnos por WhatsApp con marca, modelo, año, motor si lo tienes y una foto o número de parte. Te ayudaremos a ubicar una opción compatible.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <HelpHero />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* La banda de servicio monta sobre el hero: cierra el bloque navy en
            lugar de dejar un corte plano entre las dos superficies. */}
        <section className="relative z-10 -mt-16 grid gap-4 md:grid-cols-3">
          {trustCards.map((item) => (
            <article
              className={cn(
                cardVariants({ padding: "lg" }),
                "transition-colors hover:border-ca-navy-950/30",
              )}
              key={item.title}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-ca-control bg-ca-background text-ca-blue-700">
                <item.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h2 className="mt-4 text-base font-bold text-ca-navy-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ca-text-secondary">{item.detail}</p>
            </article>
          ))}
        </section>

        <FaqSection />

        <OperationNotes />

        <ClosingCta />
      </div>

      <SiteFooter />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HelpHero() {
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
              Ayuda y contacto
            </p>

            <h1 className="animate-fade-up delay-100 mt-4 max-w-xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Te ayudamos a encontrar{" "}
              <span className="ca-gold-shimmer">el repuesto correcto</span>
            </h1>

            <p className="animate-fade-up delay-200 mt-5 max-w-xl text-base leading-7 text-white/75">
              Si no estás seguro de la compatibilidad, escríbenos con los datos de tu
              vehículo y el SKU del producto. La meta es que compres una pieza útil, no
              una pieza que tengas que devolver.
            </p>

            <div className="animate-fade-up delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppCTA label="Consultar por WhatsApp" phone={SUPPORT_WHATSAPP_NUMBER} />
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-ca-control border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:border-white/35 hover:bg-white/[0.18]"
                href="/catalog"
              >
                Ver catálogo
              </Link>
            </div>

            <div className="animate-fade-up delay-400 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm font-semibold text-white/78">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-ca-gold-400" strokeWidth={1.9} />
                San Salvador y Santa Tecla
              </span>
              <span className="inline-flex items-center gap-2">
                <PackageCheck className="h-4 w-4 shrink-0 text-ca-gold-400" strokeWidth={1.9} />
                Retiro en bodega sin costo
              </span>
            </div>
          </div>

          {/* Panel de datos: la pregunta "¿qué te mando?" resuelta como lista
              numerada en vez de un párrafo dentro del texto de apoyo. */}
          <div className="animate-fade-up delay-300 relative overflow-hidden rounded-ca-surface border border-white/[0.09] bg-ca-navy-900/80 p-6 backdrop-blur-sm sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_-10%,rgba(18,103,197,0.28),transparent_22rem)]" />

            <div className="relative">
              <h2 className="text-lg font-bold">Escríbenos con estos datos</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Entre más completo llegue el mensaje, más rápido confirmamos si la pieza
                sirve para tu vehículo.
              </p>

              <ol className="mt-6 space-y-3">
                {requestChecklist.map((item, index) => (
                  <li
                    className="flex items-start gap-3 rounded-ca-control border border-white/[0.07] bg-white/[0.04] p-3 transition hover:border-ca-gold-400/30 hover:bg-white/[0.07]"
                    key={item.title}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ca-control border border-ca-gold-400/20 bg-ca-gold-400/10 text-ca-gold-400">
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-5">
                        <span className="mr-2 text-ca-gold-400">{index + 1}.</span>
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-white/70">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Preguntas frecuentes
// ---------------------------------------------------------------------------

function FaqSection() {
  return (
    <section className="mt-14 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-10">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="ca-section-label">
          <span className="h-px w-6 bg-ca-gold-400" />
          Preguntas frecuentes
        </p>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-ca-navy-950 sm:text-[28px]">
          Lo que preguntan antes de comprar
        </h2>
        <p className="mt-3 text-sm leading-6 text-ca-text-secondary">
          Compatibilidad, retiro, entregas e IVA. Si tu caso no está aquí, escríbenos y lo
          revisamos con los datos de tu vehículo.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            className={cn(
              cardVariants({ padding: "none" }),
              "group transition-colors hover:border-ca-navy-950/30 open:border-ca-navy-950/30",
            )}
            key={faq.question}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-ca-surface p-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ca-blue-700 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-bold leading-6 text-ca-navy-950">
                {faq.question}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ca-control border border-ca-border bg-ca-background text-ca-navy-950 transition group-open:border-ca-navy-950 group-open:bg-ca-navy-950 group-open:text-white">
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                  strokeWidth={2.2}
                />
              </span>
            </summary>
            <p className="border-t border-ca-border px-5 py-4 text-sm leading-6 text-ca-text-secondary">
              {faq.answer}
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
            <p className="text-sm font-bold text-ca-navy-950">¿Tu pregunta no está aquí?</p>
            <p className="mt-1 text-sm leading-6 text-ca-text-secondary">
              Mándanos marca, modelo y año y te respondemos con opciones compatibles.
            </p>
          </div>
          <WhatsAppCTA
            className="shrink-0"
            label="Escribir por WhatsApp"
            phone={SUPPORT_WHATSAPP_NUMBER}
            variant="subtle"
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Notas operativas
// ---------------------------------------------------------------------------

/**
 * Horario y políticas siguen sin definirse. Se muestran como notas y no como
 * beneficios: la página no debe prometer condiciones que todavía no están
 * aprobadas para producción.
 */
function OperationNotes() {
  return (
    <section className="mt-12 grid gap-4 md:grid-cols-2">
      <NoteCard
        icon={Clock}
        title="Horario de atención"
        detail="Pendiente de definir la operación final. Antes de producción se confirmará el horario de bodega y de soporte."
      />
      <NoteCard
        icon={RotateCcw}
        title="Políticas comerciales"
        detail="Garantía, cambios y devoluciones quedan como políticas operativas a confirmar. Esta página evita prometer condiciones no aprobadas todavía."
      />
    </section>
  );
}

type NoteCardProps = {
  icon: LucideIcon;
  title: string;
  detail: string;
};

function NoteCard({ icon: Icon, title, detail }: NoteCardProps) {
  return (
    <article className={cn(cardVariants({ padding: "lg" }), "flex items-start gap-4")}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-background text-ca-text-secondary">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <div>
        <h2 className="text-base font-bold text-ca-navy-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-ca-text-secondary">{detail}</p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Cierre
// ---------------------------------------------------------------------------

function ClosingCta() {
  return (
    <section className="ca-noise relative mt-4 overflow-hidden rounded-ca-surface bg-ca-navy-950 px-6 py-8 text-white sm:px-8">
      <div className="ca-grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ca-blue-700/20 blur-[70px]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            ¿Listo para buscar tu repuesto?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
            Filtra el catálogo por marca, modelo y año, o escríbenos y lo buscamos contigo.
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "accent", size: "lg" }), "shrink-0")}
          href="/catalog"
        >
          Buscar repuestos
        </Link>
      </div>
    </section>
  );
}
