import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { firstValue } from "@/lib/url-utils";
import { registerAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Crear cuenta | Castillo Auto Parts" };

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
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
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success">Bienvenido</p>
              <h1 className="text-2xl font-bold text-primary">Crear cuenta</h1>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {errorMessage}
            </div>
          ) : null}

          <form action={registerAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />

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

            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
            >
              Crear cuenta
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    missing_fields: "Por favor completa todos los campos.",
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
    email_exists: "Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?",
    error: "Ocurrió un error. Intenta de nuevo.",
  };
  return messages[estado ?? ""] ?? "";
}
