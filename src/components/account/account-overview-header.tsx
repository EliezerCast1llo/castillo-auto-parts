import type { ReactNode } from "react";
import { CheckCircle2, LogOut, ShieldCheck, UserRoundCheck } from "lucide-react";

type AccountOverviewHeaderProps = {
  createdAt?: Date | null;
  email: string | null;
  hasPassword: boolean;
  image: string | null;
  isActive?: boolean | null;
  logoutAction: () => Promise<void>;
  name: string | null;
};

export function AccountOverviewHeader({
  createdAt,
  email,
  hasPassword,
  image,
  isActive = true,
  logoutAction,
  name,
}: AccountOverviewHeaderProps) {
  const displayName = name?.trim() || "Mi cuenta";
  const displayEmail = email?.trim() || "Correo no disponible";
  const initials = getInitials(displayName, displayEmail);
  const active = isActive !== false;

  return (
    <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            aria-label={`Avatar de ${displayName}`}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ca-navy-950 text-3xl font-black text-white shadow-[0_14px_32px_rgba(6,25,51,0.22)] ring-4 ring-ca-background sm:h-24 sm:w-24 sm:text-4xl"
            role="img"
            style={image ? { backgroundImage: `url(${image})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
          >
            {image ? <span className="sr-only">{initials}</span> : initials}
          </span>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-ca-gold-500">
              Castillo Auto Parts
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ca-navy-950 sm:text-4xl">
              Mi cuenta
            </h1>
            <p className="mt-2 break-words text-sm font-semibold text-ca-text-secondary sm:text-base">
              {displayEmail}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />}
                tone={active ? "success" : "danger"}
              >
                {active ? "Cuenta activa" : "Cuenta inactiva"}
              </Badge>
              <Badge icon={<UserRoundCheck className="h-3.5 w-3.5" strokeWidth={2.2} />}>
                Cliente registrado
              </Badge>
              {!hasPassword ? (
                <Badge icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />}>
                  Acceso con proveedor
                </Badge>
              ) : null}
            </div>
            {createdAt ? (
              <p className="mt-3 text-xs font-semibold text-ca-text-secondary">
                Miembro desde {formatMonthYear(createdAt)}
              </p>
            ) : null}
          </div>
        </div>

        <form action={logoutAction} className="w-full md:w-auto">
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-black text-red-600 transition hover:border-red-400 hover:bg-red-50 md:w-auto"
            type="submit"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </section>
  );
}

function Badge({
  children,
  icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon: ReactNode;
  tone?: "danger" | "neutral" | "success";
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "danger"
        ? "border-red-200 bg-red-50 text-red-600"
        : "border-ca-border bg-ca-background text-ca-navy-950";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {icon}
      {children}
    </span>
  );
}

function getInitials(name: string, email: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
  if (words[0]) return words[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "long",
    timeZone: "America/El_Salvador",
    year: "numeric",
  }).format(value);
}
