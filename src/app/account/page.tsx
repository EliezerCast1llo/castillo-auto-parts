import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, Home, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountOverviewHeader } from "@/components/account/account-overview-header";
import { AccountPasswordForm } from "@/components/account/account-password-form";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { AccountQuickActions } from "@/components/account/account-quick-actions";
import { AccountSupportCard } from "@/components/account/account-support-card";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { firstValue } from "@/lib/url-utils";
import { changePasswordAction, logoutCustomer, updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mi cuenta | Castillo Auto Parts",
  description: "Gestiona tu perfil, revisa tus órdenes y tus direcciones guardadas.",
  robots: { index: false, follow: false },
};

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?next=/account");

  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado);
  const statusMessage = getStatusMessage(estado);
  const errorMessage = getErrorMessage(estado);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      _count: {
        select: {
          addresses: true,
          orders: true,
        },
      },
      createdAt: true,
      email: true,
      image: true,
      isActive: true,
      lastLoginAt: true,
      name: true,
      passwordHash: true,
      phone: true,
    },
  });

  if (!user) redirect("/auth/login?next=/account");

  const hasPassword = Boolean(user.passwordHash);

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm font-bold text-ca-text-secondary">
          <Link className="inline-flex items-center gap-1.5 transition hover:text-ca-navy-950" href="/">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ca-navy-950">Mi cuenta</span>
        </nav>

        <div className="space-y-5">
          <AccountOverviewHeader
            createdAt={user.createdAt}
            email={user.email}
            hasPassword={hasPassword}
            image={user.image}
            isActive={user.isActive}
            logoutAction={logoutCustomer}
            name={user.name}
          />

          <AccountQuickActions
            addressesCount={user._count.addresses}
            ordersCount={user._count.orders}
          />

          <AccountNotice errorMessage={errorMessage} statusMessage={statusMessage} />

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <AccountProfileForm
                action={updateProfileAction}
                email={user.email}
                name={user.name}
                phone={user.phone}
              />
            </div>

            <div className="lg:col-span-6">
              <AccountPasswordForm action={changePasswordAction} hasPassword={hasPassword} />
            </div>

            <div className="lg:col-span-8">
              <AccountSupportCard />
            </div>

            <aside className="lg:col-span-4">
              <AccountSummaryCard
                addressesCount={user._count.addresses}
                createdAt={user.createdAt}
                isActive={user.isActive}
                lastLoginAt={user.lastLoginAt}
                ordersCount={user._count.orders}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountNotice({
  errorMessage,
  statusMessage,
}: {
  errorMessage: string;
  statusMessage: string;
}) {
  if (!statusMessage && !errorMessage) return null;

  if (statusMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 shadow-[0_8px_20px_rgba(22,128,58,0.08)]">
        {statusMessage}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 shadow-[0_8px_20px_rgba(180,35,24,0.08)]">
      {errorMessage}
    </div>
  );
}

function AccountSummaryCard({
  addressesCount,
  createdAt,
  isActive,
  lastLoginAt,
  ordersCount,
}: {
  addressesCount: number;
  createdAt: Date;
  isActive: boolean;
  lastLoginAt: Date | null;
  ordersCount: number;
}) {
  return (
    <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ca-background text-ca-navy-950">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-lg font-black text-ca-navy-950">Resumen de cuenta</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
            Datos rápidos de tu actividad.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <SummaryRow
          icon={<CheckCircle2 className="h-4 w-4" strokeWidth={2} />}
          label="Estado"
          value={isActive ? "Cuenta activa" : "Cuenta inactiva"}
        />
        <SummaryRow
          icon={<ClipboardList className="h-4 w-4" strokeWidth={2} />}
          label="Órdenes"
          value={formatOrdersCount(ordersCount)}
        />
        <SummaryRow
          icon={<MapPin className="h-4 w-4" strokeWidth={2} />}
          label="Direcciones"
          value={formatAddressesCount(addressesCount)}
        />
        <SummaryRow
          icon={<CalendarDays className="h-4 w-4" strokeWidth={2} />}
          label="Miembro desde"
          value={formatMonthYear(createdAt)}
        />
        {lastLoginAt ? (
          <SummaryRow
            icon={<CalendarDays className="h-4 w-4" strokeWidth={2} />}
            label="Último acceso"
            value={formatShortDate(lastLoginAt)}
          />
        ) : null}
      </div>
    </section>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ca-border bg-ca-background px-3 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-ca-text-secondary">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-ca-navy-950">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-right text-sm font-black text-ca-navy-950">{value}</span>
    </div>
  );
}

function getStatusMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    password_changed: "Contraseña cambiada correctamente.",
    updated: "Teléfono actualizado correctamente.",
  };
  return messages[estado ?? ""] ?? "";
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    invalid_phone: "Ingresa un teléfono válido o deja el campo vacío.",
    missing_name: "El nombre es requerido.",
    no_credentials: "Tu cuenta no tiene contraseña propia (usas Google).",
    password_mismatch: "Las contraseñas no coinciden.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    wrong_password: "La contraseña actual es incorrecta.",
  };
  return messages[estado ?? ""] ?? "";
}

function formatOrdersCount(value: number) {
  if (value === 1) return "1 orden";
  return `${value} órdenes`;
}

function formatAddressesCount(value: number) {
  if (value === 1) return "1 dirección";
  return `${value} direcciones`;
}

function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "long",
    timeZone: "America/El_Salvador",
    year: "numeric",
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeZone: "America/El_Salvador",
  }).format(value);
}
