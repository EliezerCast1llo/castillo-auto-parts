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
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ca-navy-950 text-white shadow-[0_10px_20px_rgba(6,25,51,0.18)]">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">Bienvenido</p>
              <h1 className="text-2xl font-black text-ca-navy-950">Crear cuenta</h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-ca-border bg-white p-6 shadow-[var(--ca-shadow-premium)]">
            {errorMessage ? (
              <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </div>
            ) : null}

            <form action={registerAction} className="space-y-4">
              <input type="hidden" name="next" value={nextPath} />

              <div>
                <label htmlFor="name" className="block text-sm font-bold text-ca-navy-950">
                  Nombre completo
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  type="text"
                  autoComplete="name"
                  className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-ca-navy-950">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-ca-navy-950">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
                />
              </div>

              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-bold text-ca-navy-950">
                  Confirmar contraseña
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
                />
              </div>

              <p className="text-xs text-ca-text-secondary">Mínimo 8 caracteres.</p>

              <button
                type="submit"
                className="inline-flex h-[52px] w-full items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-[0_10px_20px_rgba(6,25,51,0.18)] transition hover:bg-ca-navy-800"
              >
                Crear cuenta
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-ca-text-secondary">
            ¿Ya tienes cuenta?{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
              className="font-bold text-ca-blue-700 hover:underline"
            >
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
