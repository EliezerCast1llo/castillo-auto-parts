import type { LocaleHref } from "@/lib/i18n/navigation";
import { Link } from "@/lib/i18n/navigation";
import { SearchX } from "lucide-react";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { WhatsAppCTA } from "@/components/whatsapp-cta";

type EmptyStateProps = {
  actionHref?: LocaleHref;
  actionLabel?: string;
  description?: string;
  /** Icono del estado vacío; por defecto SearchX. */
  icon?: React.ReactNode;
  showWhatsApp?: boolean;
  /**
   * Atajos de búsqueda. `label` es lo que se lee; `query` es lo que se busca.
   *
   * Van separados porque no son lo mismo: el label se traduce y la query tiene
   * que coincidir con el dato. Colapsarlos hacía que en inglés cada atajo
   * llevara a otra búsqueda vacía — justo en la pantalla que existe para
   * rescatar una búsqueda fallida.
   */
  suggestions?: { label: string; query: string }[];
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  icon,
  showWhatsApp = false,
  suggestions = [],
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-ca-surface border border-ca-border bg-white p-6 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-ca-surface bg-ca-navy-950/7 text-ca-navy-950">
          {icon ?? <SearchX className="h-7 w-7" strokeWidth={1.8} />}
        </span>
        <h3 className="mt-4 text-xl font-black text-ca-navy-950">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-ca-text-secondary">{description}</p>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <Link
                className="rounded-full border border-ca-border bg-ca-background px-3 py-1.5 text-xs font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-white"
                data-testid="empty-state-suggestion"
                href={{ pathname: "/catalog", query: { q: suggestion.query } }}
                key={suggestion.query}
              >
                {suggestion.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actionHref && actionLabel ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-ca-control bg-ca-navy-950 px-5 text-sm font-black text-white transition hover:bg-ca-navy-800"
              href={actionHref}
            >
              {actionLabel}
            </Link>
          ) : null}
          {showWhatsApp ? (
            <WhatsAppCTA phone={SUPPORT_WHATSAPP_NUMBER} variant="inline" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
