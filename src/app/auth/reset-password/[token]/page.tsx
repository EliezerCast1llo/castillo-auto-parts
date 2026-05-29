import { notFound } from "next/navigation";
import { KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { verifyPasswordResetToken } from "@/lib/auth-user";
import { firstValue } from "@/lib/url-utils";
import { applyPasswordResetAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nueva contraseña | Castillo Auto Parts" };

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { token } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const errorMessage = getErrorMessage(firstValue(queryParams.estado));

  const record = await verifyPasswordResetToken(token);
  if (!record) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Cuenta</p>
              <h1 className="text-2xl font-bold text-primary">Nueva contraseña</h1>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {errorMessage}
            </div>
          ) : null}

          <form action={applyPasswordResetAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />

            <label className="block text-sm font-semibold">
              Nueva contraseña
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
              Guardar nueva contraseña
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(estado: string | undefined) {
  const messages: Record<string, string> = {
    weak_password: "La contraseña debe tener al menos 8 caracteres.",
    password_mismatch: "Las contraseñas no coinciden.",
  };
  return messages[estado ?? ""] ?? "";
}
