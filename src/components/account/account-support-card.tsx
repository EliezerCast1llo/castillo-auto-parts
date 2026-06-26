import { Headphones } from "lucide-react";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";

export function AccountSupportCard() {
  return (
    <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ca-navy-950 text-white shadow-[0_10px_24px_rgba(6,25,51,0.2)]">
            <Headphones className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-xl font-black text-ca-navy-950">
              ¿Necesitas ayuda con tu cuenta?
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-ca-text-secondary">
              Nuestro equipo puede ayudarte con tus datos, direcciones o pedidos.
            </p>
          </div>
        </div>

        <WhatsAppCTA
          className="h-11 w-full justify-center sm:w-auto"
          label="Contactar asesor"
          phone={SUPPORT_WHATSAPP_NUMBER}
          variant="subtle"
        />
      </div>
    </section>
  );
}
