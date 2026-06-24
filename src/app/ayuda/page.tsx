import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Ayuda y contacto | Castillo Auto Parts",
  description:
    "Ayuda para comprar repuestos automotrices, validar compatibilidad, retiro en bodega y entregas locales en El Salvador.",
};

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

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Compatibilidad primero",
    detail: "Validamos datos del vehículo antes de que compres una pieza incorrecta.",
  },
  {
    icon: PackageCheck,
    title: "Stock visible",
    detail: "El catálogo muestra disponibilidad y últimas unidades cuando aplica.",
  },
  {
    icon: Truck,
    title: "Entrega local",
    detail: "Retiro gratis en bodega y envíos por zona dentro de la cobertura inicial.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-ca-border bg-white shadow-[var(--ca-shadow-soft)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                Ayuda y contacto
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-ca-navy-950 sm:text-4xl">
                Te ayudamos a encontrar el repuesto correcto
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ca-text-secondary">
                Si no estás seguro de la compatibilidad, envíanos los datos de tu vehículo y el SKU del producto. La meta es que compres una pieza útil, no una pieza que tengas que devolver.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <WhatsAppCTA
                  label="Consultar por WhatsApp"
                  phone={SUPPORT_WHATSAPP_NUMBER}
                />
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-[14px] border border-ca-border bg-white px-5 text-sm font-black text-ca-navy-950 transition hover:bg-ca-background"
                  href="/catalog"
                >
                  Ver catálogo
                </Link>
              </div>
            </div>

            <div className="border-t border-ca-border bg-ca-navy-950 p-6 text-white lg:border-l lg:border-t-0">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ca-gold-400" />
                <div>
                  <h2 className="text-base font-black">Cobertura inicial</h2>
                  <p className="mt-2 text-sm leading-6 text-white/76">
                    San Salvador y Santa Tecla para entregas locales. Retiro en bodega disponible sin costo.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/12 bg-white/8 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ca-gold-400" />
                <div>
                  <p className="text-sm font-black">Horario de atención</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">
                    Pendiente de definir operación final. Antes de producción se confirmará horario de bodega y soporte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {trustCards.map((item) => (
            <article
              className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)]"
              key={item.title}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ca-background text-ca-blue-700">
                <item.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h2 className="mt-4 text-base font-black text-ca-navy-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ca-text-secondary">{item.detail}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-ca-border bg-white p-6 shadow-[var(--ca-shadow-soft)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-ca-gold-400" />
            <h2 className="text-2xl font-black text-ca-navy-950">Preguntas frecuentes</h2>
          </div>

          <div className="mt-6 divide-y divide-ca-border">
            {faqs.map((faq) => (
              <details className="group py-4" key={faq.question}>
                <summary className="cursor-pointer list-none text-base font-black text-ca-navy-950 marker:hidden">
                  <span className="inline-flex w-full items-center justify-between gap-4">
                    {faq.question}
                    <span className="rounded-full border border-ca-border px-2 py-0.5 text-xs text-ca-text-secondary transition group-open:bg-ca-navy-950 group-open:text-white">
                      Ver
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ca-text-secondary">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-ca-border bg-white p-6 shadow-[var(--ca-shadow-soft)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <RotateCcw className="mt-1 h-5 w-5 shrink-0 text-ca-blue-700" />
              <div>
                <h2 className="text-lg font-black text-ca-navy-950">Políticas comerciales</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-ca-text-secondary">
                  Garantía, cambios y devoluciones quedan como políticas operativas a confirmar antes de producción. Esta página evita prometer condiciones no aprobadas todavía.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl border border-ca-border bg-ca-background px-4 text-sm font-black text-ca-navy-950 transition hover:bg-white"
              href="/catalog"
            >
              Buscar repuestos
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
