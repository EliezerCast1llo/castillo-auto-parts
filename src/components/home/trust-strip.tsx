import { BadgeCheck, LockKeyhole, ShieldCheck, Truck } from "lucide-react";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Repuestos originales",
    detail: "Calidad garantizada",
    accent: "text-ca-gold-500",
  },
  {
    icon: ShieldCheck,
    title: "Garantía incluida",
    detail: "Respaldo en cada compra",
    accent: "text-ca-blue-700",
  },
  {
    icon: Truck,
    title: "Envío rápido",
    detail: "San Salvador y Santa Tecla",
    accent: "text-ca-navy-800",
  },
  {
    icon: LockKeyhole,
    title: "Pago seguro",
    detail: "Transacciones protegidas",
    accent: "text-ca-navy-800",
  },
];

export function TrustStrip() {
  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl border border-ca-border bg-white shadow-ca-soft">
      <div className="grid divide-y divide-ca-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {trustItems.map((item, i) => (
          <div
            className="flex items-center gap-4 px-5 py-5 transition hover:bg-ca-background"
            key={item.title}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ca-background ${item.accent}`}>
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-ca-navy-950">{item.title}</span>
              <span className="mt-0.5 block text-xs font-medium text-ca-text-secondary">{item.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
