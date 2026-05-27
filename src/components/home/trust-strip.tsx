import { BadgeCheck, LockKeyhole, ShieldCheck, Truck } from "lucide-react";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "Repuestos originales",
    detail: "Calidad garantizada",
  },
  {
    icon: ShieldCheck,
    title: "Garantía",
    detail: "Respaldo en cada compra",
  },
  {
    icon: Truck,
    title: "Envío rápido",
    detail: "San Salvador y Santa Tecla",
  },
  {
    icon: LockKeyhole,
    title: "Pago seguro",
    detail: "Transacciones protegidas",
  },
];

export function TrustStrip() {
  return (
    <section className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => (
          <div className="flex min-h-18 items-center gap-4 rounded-2xl px-3 py-2" key={item.title}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ca-navy-950/[0.07] text-ca-navy-900">
              <item.icon className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-ca-navy-950">{item.title}</span>
              <span className="mt-1 block text-sm font-medium text-ca-text-secondary">{item.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
