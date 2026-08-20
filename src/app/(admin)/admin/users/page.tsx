import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { ROLE_LABELS, listAdminUsers } from "@/lib/admin-user";
import { formatDateTime } from "@/lib/order-formatters";
import { firstValue } from "@/lib/url-utils";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuarios admin | Castillo Auto Parts",
};

type AdminUsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const adminUser = await requireAdminRole("ADMIN");
  const params = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(firstValue(params.estado));
  const users = await listAdminUsers();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={defaultLocale} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-bold text-primary">Usuarios admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {users.length} {users.length === 1 ? "usuario" : "usuarios"} en el panel
            </p>
          </div>
          <AdminNav active="users" user={adminUser} />
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Todos los usuarios</h2>
          <Link
            href="/admin/users/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Último acceso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="bg-card hover:bg-background">
                  <td className="px-4 py-3 font-semibold text-primary">
                    {user.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="text-success font-semibold">Activo</span>
                    ) : (
                      <span className="text-muted-foreground font-semibold">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.id !== adminUser.id ? (
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">(tú)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No hay usuarios registrados aún.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function getStatusMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    created: "Usuario creado correctamente.",
  };
  return messages[estado ?? ""] ?? "";
}
