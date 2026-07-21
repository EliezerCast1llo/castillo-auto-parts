import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getAdminSecretConfig, getSafeAdminNextPath, isAdminAuthenticated } from "@/lib/admin-auth";
import { firstValue } from "@/lib/url-utils";
import { loginAdmin } from "./actions";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  robots: { follow: false, index: false },
  title: "Admin | Castillo Auto Parts",
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeAdminNextPath(firstValue(params.next));
  const statusMessage = getStatusMessage(firstValue(params.estado));
  const config = getAdminSecretConfig();

  if (await isAdminAuthenticated()) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md rounded-md border border-border bg-card p-6 shadow-ca-card">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success">Área protegida</p>
              <h1 className="text-2xl font-bold text-primary">Acceso admin</h1>
            </div>
          </div>

          {statusMessage ? <AdminLoginNotice message={statusMessage} /> : null}

          {!config.isConfigured ? (
            <AdminLoginNotice message="Falta ADMIN_ACCESS_SECRET en el entorno. Configura la variable antes de continuar." />
          ) : null}

          {config.isConfigured && !config.isSafeForRuntime ? (
            <AdminLoginNotice message="La configuración admin no es segura para este entorno. Usa un secreto de al menos 32 caracteres." />
          ) : null}

          <form action={loginAdmin} className="mt-5 space-y-4">
            <input name="next" type="hidden" value={nextPath} />

            <label className="block text-sm font-semibold">
              Correo electrónico
              <input
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                disabled={!config.isConfigured || !config.isSafeForRuntime}
                name="email"
                required
                type="email"
              />
            </label>

            <label className="block text-sm font-semibold">
              Contraseña
              <input
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                disabled={!config.isConfigured || !config.isSafeForRuntime}
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!config.isConfigured || !config.isSafeForRuntime}
            >
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AdminLoginNotice({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-md bg-warning/15 p-3 text-sm font-semibold text-primary">
      {message}
    </div>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    invalid: "Email o contraseña incorrectos.",
    logged_out: "Sesión cerrada.",
    not_configured: "El acceso admin no está configurado.",
    rate_limited: "Demasiados intentos fallidos. Espera unos minutos antes de intentar de nuevo.",
    unsafe_config: "La configuración admin no es segura para este entorno.",
  };

  return messages[status] ?? "";
}
