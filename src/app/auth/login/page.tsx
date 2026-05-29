import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { firstValue } from "@/lib/url-utils";
import { loginWithCredentials, loginWithGoogle } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Iniciar sesión | Castillo Auto Parts" };

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeCustomerNextPath(firstValue(params.next));
  const errorMessage = getErrorMessage(firstValue(params.estado));

  if (session?.user) redirect(nextPath);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <LogIn className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success">Tu cuenta</p>
              <h1 className="text-2xl font-bold text-primary">Iniciar sesión</h1>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {errorMessage}
            </div>
          ) : null}

          {/* Google */}
          <form action={loginWithGoogle} className="mt-6">
            <input type="hidden" name="next" value={nextPath} />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary transition hover:bg-background"
            >
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">o con tu correo</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Credentials */}
          <form action={loginWithCredentials} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />

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

            <label className="block text-sm font-semibold">
              Contraseña
              <input
                name="password"
                required
                type="password"
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
            >
              Entrar
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href={`/auth/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-primary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    invalid: "Email o contraseña incorrectos.",
    oauth_error: "Ocurrió un error al conectar con Google. Intenta de nuevo.",
  };
  return messages[estado ?? ""] ?? "";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}
