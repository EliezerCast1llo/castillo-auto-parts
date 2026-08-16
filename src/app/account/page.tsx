import Link from "next/link";
import { Home } from "lucide-react";
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
  description: "Gestiona tu perfil, revisa tus pedidos y tus direcciones guardadas.",
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

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <AccountProfileForm
                action={updateProfileAction}
                email={user.email}
                name={user.name}
                phone={user.phone}
              />
            </div>

            <div className="min-w-0">
              <AccountPasswordForm action={changePasswordAction} hasPassword={hasPassword} />
            </div>

            <div className="lg:col-span-2">
              <AccountSupportCard />
            </div>
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
