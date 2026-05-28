import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { ADMIN_ROLES, ROLE_LABELS } from "@/lib/admin-user";
import { firstValue } from "@/lib/url-utils";
import { createAdminUserAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nuevo usuario admin | Castillo Auto Parts",
};

type NewAdminUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAdminUserPage({ searchParams }: NewAdminUserPageProps) {
  const adminUser = await requireAdminRole("ADMIN");
  const params = searchParams ? await searchParams : {};
  const errorMessage = getErrorMessage(firstValue(params.estado));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a usuarios
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-primary">Nuevo usuario</h1>
          </div>
          <AdminNav active="users" user={adminUser} />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {errorMessage}
          </div>
        ) : null}

        <form action={createAdminUserAction} className="mt-6 space-y-5 rounded-md border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Nombre completo
              <input
                name="name"
                required
                type="text"
                autoComplete="name"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block text-sm font-semibold">
              Correo electrónico
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Rol
            <select
              name="role"
              required
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Contraseña
              <input
                name="password"
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
                name="passwordConfirm"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>

          <div className="flex gap-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-white"
            >
              Crear usuario
            </button>
            <Link
              href="/admin/users"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-semibold text-primary"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    missing_fields: "Por favor completa todos los campos requeridos.",
    invalid_role: "El rol seleccionado no es válido.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
    email_exists: "Ya existe un usuario con ese correo electrónico.",
  };
  return messages[estado ?? ""] ?? "";
}
