import Link from "next/link";
import { ClipboardList, MapPin, User } from "lucide-react";
import { redirect } from "next/navigation";
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
  const statusMessage = getStatusMessage(firstValue(params.estado));
  const errorMessage = getErrorMessage(firstValue(params.estado));

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, passwordHash: true, image: true },
  });

  const hasPassword = Boolean(user?.passwordHash);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Mi cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <form action={logoutCustomer}>
            <button type="submit" className="text-sm font-semibold text-muted-foreground hover:text-primary">
              Cerrar sesión
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="flex items-center gap-3 rounded-md border border-border bg-card p-4 hover:border-primary/40"
          >
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">Mis órdenes</p>
              <p className="text-xs text-muted-foreground">Historial de compras</p>
            </div>
          </Link>
          <Link
            href="/account/addresses"
            className="flex items-center gap-3 rounded-md border border-border bg-card p-4 hover:border-primary/40"
          >
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">Mis direcciones</p>
              <p className="text-xs text-muted-foreground">Direcciones guardadas</p>
            </div>
          </Link>
        </div>

        {statusMessage ? (
          <div className="mt-5 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {errorMessage}
          </div>
        ) : null}

        {/* Perfil */}
        <section className="mt-6 rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-primary">Datos personales</h2>
          </div>

          <form action={updateProfileAction} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Nombre completo
                <input
                  name="name"
                  required
                  type="text"
                  defaultValue={user?.name ?? ""}
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block text-sm font-semibold">
                Teléfono
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user?.phone ?? ""}
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
            >
              Guardar cambios
            </button>
          </form>
        </section>

        {/* Cambiar contraseña (solo si tiene credenciales propias) */}
        {hasPassword ? (
          <section className="mt-4 rounded-md border border-border bg-card p-5">
            <h2 className="text-base font-bold text-primary">Cambiar contraseña</h2>

            <form action={changePasswordAction} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                Contraseña actual
                <input
                  name="currentPassword"
                  required
                  type="password"
                  autoComplete="current-password"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Nueva contraseña
                  <input
                    name="newPassword"
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Confirmar contraseña
                  <input
                    name="confirmPassword"
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md border border-primary px-5 text-sm font-semibold text-primary"
              >
                Cambiar contraseña
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function getStatusMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    updated: "Datos actualizados correctamente.",
    password_changed: "Contraseña cambiada correctamente.",
  };
  return messages[estado ?? ""] ?? "";
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    missing_name: "El nombre es requerido.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
    wrong_password: "La contraseña actual es incorrecta.",
    no_credentials: "Tu cuenta no tiene contraseña propia (usas Google).",
  };
  return messages[estado ?? ""] ?? "";
}
