import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, MessageCircle, PackageCheck, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Ayuda para comprar repuestos | Castillo Auto Parts",
  description:
    "Te ayudamos a encontrar el repuesto compatible con tu vehículo y a elegir cómo recibirlo en San Salvador o Santa Tecla.",
};

const faqs = [
  {
    question: "¿Cómo sé si un repuesto es compatible con mi vehículo?",
    answer:
      "Busca por marca, modelo y año en el catálogo. En la página del repuesto revisa los vehículos compatibles y, si tienes duda, escríbenos por WhatsApp antes de comprar.",
  },
  {
    question: "¿Puedo retirar mi pedido en bodega?",
    answer:
      "Sí. El retiro en bodega no tiene costo. Al elegir esta opción en el proceso de compra verás la dirección, el horario y las indicaciones para recoger tu pedido.",
  },
  {
    question: "¿Hacen entregas a domicilio?",
    answer:
      "Tenemos entregas locales en San Salvador y Santa Tecla. La tarifa se calcula según el municipio que selecciones durante el proceso de compra.",
  },
  {
    question: "¿Los precios incluyen IVA?",
    answer:
      "Sí. Los precios de los repuestos ya incluyen el 13 % de IVA. En el proceso de compra verás el subtotal, el costo de entrega cuando corresponda y el total estimado.",
  },
  {
    question: "¿Qué pasa si no encuentro el repuesto?",
    answer:
      "Escríbenos por WhatsApp con la marca, el modelo y el año de tu vehículo. También puedes enviarnos el motor, una foto, el nombre del repuesto o un número de parte.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Cuéntanos qué vehículo tienes",
    description: "Comparte la marca, el modelo, el año y cualquier dato que conozcas.",
  },
  {
    number: "02",
    title: "Verificamos el repuesto",
    description: "Revisamos compatibilidad y disponibilidad antes de que compres.",
  },
  {
    number: "03",
    title: "Elige cómo recibirlo",
    description: "Selecciona retiro en bodega o entrega local cuando esté disponible.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[24px] border border-ca-border bg-white shadow-[var(--ca-shadow-soft)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ca-gold-500">
                <span className="h-px w-6 bg-ca-gold-500" />
                Ayuda para comprar
              </p>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.08] tracking-tight text-ca-navy-950 sm:text-4xl lg:text-[2.75rem]">
                Encuentra el repuesto correcto para tu vehículo
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ca-text-secondary">
                ¿No estás seguro de cuál necesitas? Envíanos los datos de tu vehículo, una foto o el número de parte. Te ayudaremos a revisar la compatibilidad antes de comprar.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <WhatsAppCTA
                  className="h-12 justify-center"
                  label="Consultar por WhatsApp"
                  phone={SUPPORT_WHATSAPP_NUMBER}
                />
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-[14px] border border-ca-border bg-white px-5 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950/30 hover:bg-ca-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-blue-700/40"
                  href="/catalog"
                >
                  Explorar catálogo
                </Link>
              </div>
            </div>

            <div className="bg-ca-navy-950 p-6 text-white sm:p-8 lg:p-9">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ca-blue-700 text-white">
                  <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-ca-gold-400">
                    Empieza tu consulta
                  </p>
                  <h2 className="mt-2 text-xl font-black leading-tight">Para ayudarte, envíanos estos datos</h2>
                </div>
              </div>

              <ol className="mt-7 space-y-5">
                <HelpItem number="1">Marca, modelo y año del vehículo.</HelpItem>
                <HelpItem number="2">Motor o versión, si los conoces.</HelpItem>
                <HelpItem number="3">Foto del repuesto o número de parte.</HelpItem>
              </ol>

              <p className="mt-7 border-t border-white/15 pt-5 text-sm leading-6 text-white/75">
                No necesitas conocer el nombre exacto del repuesto para consultarnos.
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Opciones de entrega" className="mt-5 grid gap-3 sm:grid-cols-2">
          <CompactInfo icon={<MapPin className="h-5 w-5" strokeWidth={1.8} />}>
            Entregas locales en San Salvador y Santa Tecla.
          </CompactInfo>
          <CompactInfo icon={<PackageCheck className="h-5 w-5" strokeWidth={1.8} />}>
            Retiro en bodega disponible sin costo.
          </CompactInfo>
        </section>

        <section className="mt-10 rounded-[24px] border border-ca-border bg-white px-6 py-7 shadow-[var(--ca-shadow-soft)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-2 border-b border-ca-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ca-gold-500">Compra asistida</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-ca-navy-950">Así te ayudamos a encontrarlo</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ca-text-secondary">
              Acompañamiento claro desde la consulta hasta la entrega.
            </p>
          </div>

          <div className="grid lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                className={`py-6 lg:px-7 lg:py-7 ${index > 0 ? "border-t border-ca-border lg:border-l lg:border-t-0" : "lg:pl-0"} ${index === processSteps.length - 1 ? "lg:pr-0" : ""}`}
                key={step.number}
              >
                <p className="text-sm font-black tracking-[0.12em] text-ca-blue-700">{step.number}</p>
                <h3 className="mt-3 text-base font-black leading-5 text-ca-navy-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ca-text-secondary">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[24px] border border-ca-border bg-white p-6 shadow-[var(--ca-shadow-soft)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-ca-gold-400" />
            <h2 className="text-2xl font-black tracking-tight text-ca-navy-950">Preguntas frecuentes</h2>
          </div>

          <div className="mt-5 divide-y divide-ca-border">
            {faqs.map((faq) => (
              <details className="group py-4" key={faq.question}>
                <summary className="cursor-pointer list-none text-base font-black text-ca-navy-950 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-blue-700/40">
                  <span className="inline-flex w-full items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="shrink-0 text-sm font-bold text-ca-blue-700 group-open:text-ca-navy-950">
                      <span className="group-open:hidden">Ver respuesta</span>
                      <span className="hidden group-open:inline">Ocultar respuesta</span>
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ca-text-secondary">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-[24px] border border-ca-border bg-white p-6 shadow-[var(--ca-shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-1 h-5 w-5 shrink-0 text-ca-blue-700" strokeWidth={1.8} />
            <div>
              <h2 className="text-lg font-black text-ca-navy-950">Políticas comerciales</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-ca-text-secondary">
                Para conocer las condiciones aplicables a tu compra, consúltanos antes de confirmar el pedido. No publicamos promesas sobre garantías, cambios o devoluciones que aún no estén definidas.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-ca-border bg-ca-background px-4 text-sm font-black text-ca-navy-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-blue-700/40"
            href="/catalog"
          >
            Buscar repuestos
          </Link>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

function HelpItem({ children, number }: { children: React.ReactNode; number: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ca-gold-400/50 text-xs font-black text-ca-gold-400">
        {number}
      </span>
      <span className="pt-1 text-sm font-bold leading-5 text-white/90">{children}</span>
    </li>
  );
}

function CompactInfo({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-ca-border px-1 py-3 text-sm font-bold text-ca-navy-950 sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-ca-blue-700">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}
