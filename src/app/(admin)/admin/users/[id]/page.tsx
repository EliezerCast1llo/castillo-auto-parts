import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { ADMIN_ROLES, ROLE_LABELS, getAdminUserById } from "@/lib/admin-user";
import { firstValue } from "@/lib/url-utils";
import { updateAdminUserAction } from "../actions";

export const dynamic = "force-dynamic";

type EditAdminUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: EditAdminUserPageProps) {
  const { id } = await params;
  const user = await getAdminUserById(id);
  return {
    title: user ? `Editar ${user.name ?? user.email} | Castillo Auto Parts` : "Usuario no encontrado",
  };
}

export default async function EditAdminUserPage({ params, searchParams }: EditAdminUserPageProps) {
  const adminUser = await requireAdminRole("ADMIN");
  const { id } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(firstValue(queryParams.estado));
  const errorMessage = getErrorMessage(firstValue(queryParams.estado));

  const targetUser = await getAdminUserById(id);
  if (!targetUser) notFound();

  const isSelf = targetUser.id === adminUser.id;

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
            <h1 className="mt-5 text-2xl font-bold text-primary">
              {targetUser.name ?? targetUser.email}
            </h1>
          </div>
          <AdminNav active="users" user={adminUser} />
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
            {errorMessage}
          </div>
        ) : null}

        <form action={updateAdminUserAction} className="mt-6 space-y-5 rounded-md border border-border bg-card p-5">
          <input type="hidden" name="id" value={targetUser.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Nombre completo
              <input
                name="name"
                required
                type="text"
                defaultValue={targetUser.name ?? ""}
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <div className="block text-sm font-semibold">
              Correo electrónico
              <p className="mt-2 flex h-11 items-center rounded-md border border-border bg-background/50 px-3 text-sm text-muted-foreground">
                {targetUser.email}
              </p>
            </div>
          </div>

          <label className="block text-sm font-semibold">
            Rol
            <select
              name="role"
              required
              defaultValue={targetUser.role}
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          {!isSelf ? (
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="hidden"
                name="isActive"
                value="false"
              />
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={targetUser.isActive}
                className="h-4 w-4 rounded border-border"
              />
              Usuario activo
            </label>
          ) : (
            <input type="hidden" name="isActive" value="true" />
          )}

          <div className="border-t border-border pt-5">
            <p className="text-sm font-semibold">Cambiar contraseña</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deja en blanco para mantener la contraseña actual.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Nueva contraseña
                <input
                  name="password"
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
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-white"
            >
              Guardar cambios
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

function getStatusMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    updated: "Usuario actualizado correctamente.",
  };
  return messages[estado ?? ""] ?? "";
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    missing_fields: "Por favor completa todos los campos requeridos.",
    invalid_role: "El rol seleccionado no es válido.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
  };
  return messages[estado ?? ""] ?? "";
}
