import { Link } from "@/lib/i18n/navigation";
import { KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { firstValue } from "@/lib/url-utils";
import { requestPasswordReset } from "./actions";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";

export const metadata = {
  robots: { follow: false, index: false },
  title: "Recuperar contraseña | Castillo Auto Parts",
};

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  params: routeParams,
  searchParams,
}: ForgotPasswordPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado);
  const sent = estado === "sent";
  const rateLimited = estado === "rate_limited";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Acceso</p>
              <h1 className="text-2xl font-bold text-primary">Recuperar contraseña</h1>
            </div>
          </div>

          {sent ? (
            <div className="mt-6 rounded-md bg-success/10 p-4 text-sm font-semibold text-success">
              Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </div>
          ) : rateLimited ? (
            <div className="mt-6 rounded-md bg-destructive/10 p-4 text-sm font-semibold text-destructive">
              Demasiados intentos. Espera unos minutos e intenta de nuevo.
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form action={requestPasswordReset} className="mt-6 space-y-4">
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

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
                >
                  Enviar enlace
                </button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
