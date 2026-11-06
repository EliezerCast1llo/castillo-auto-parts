import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getSafeAdminNextPath, isAdminAuthenticated } from "@/lib/admin-auth";
import {
  cancelAdminTwoFactorLogin,
  resendAdminTwoFactorCode,
  verifyAdminTwoFactor,
} from "@/lib/actions/admin-login";
import { maskEmail } from "@/lib/customer-credentials";
import { db } from "@/lib/db";
import { defaultLocale } from "@/lib/i18n/config";
import { TWO_FACTOR_LIMITS } from "@/lib/two-factor";
import { readPendingTwoFactorCookie } from "@/lib/two-factor-cookie";
import { TWO_FACTOR_EXPIRES_IN_MINUTES } from "@/lib/two-factor-delivery";
import { firstValue } from "@/lib/url-utils";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { follow: false, index: false },
  title: "Verificación | Castillo Auto Parts",
};

/** El único estado de esta pantalla que es una buena noticia. */
const SUCCESS_STATUS = "two_factor_sent";

type AdminTwoFactorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTwoFactorPage({ searchParams }: AdminTwoFactorPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeAdminNextPath(firstValue(params.next));

  // Ya hay sesión: el código se usó y esta pantalla no tiene nada que pedir.
  if (await isAdminAuthenticated()) redirect(nextPath);

  const pending = await readPendingTwoFactorCookie("admin");

  // Sin desafío pendiente no hay nada que verificar. Se vuelve al ingreso en
  // vez de mostrar un formulario que fallaría siempre.
  if (!pending) {
    redirect(`/admin/login?estado=two_factor_restart&next=${encodeURIComponent(nextPath)}`);
  }

  const user = await db.user.findUnique({
    where: { id: pending.userId },
    select: { email: true },
  });

  if (!user) {
    redirect(`/admin/login?estado=two_factor_restart&next=${encodeURIComponent(nextPath)}`);
  }

  const estado = firstValue(params.estado);
  const statusMessage = getStatusMessage(estado);
  const isSuccess = estado === SUCCESS_STATUS;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={defaultLocale} />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md rounded-md border border-border bg-card p-6 shadow-ca-card">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success">Área protegida</p>
              <h1 className="text-2xl font-bold text-primary">Verifica tu ingreso</h1>
            </div>
          </div>

          {statusMessage ? (
            <div
              className={
                isSuccess
                  ? "mt-4 rounded-md bg-success/15 p-3 text-sm font-semibold text-primary"
                  : "mt-4 rounded-md bg-warning/15 p-3 text-sm font-semibold text-primary"
              }
            >
              {statusMessage}
            </div>
          ) : null}

          <p className="mt-4 text-sm text-muted-foreground">
            Enviamos un código de {TWO_FACTOR_LIMITS.codeLength} dígitos a {maskEmail(user.email)}.
            Escríbelo para entrar al panel.
          </p>

          <form action={verifyAdminTwoFactor} className="mt-5 space-y-4">
            <input name="next" type="hidden" value={nextPath} />

            <label className="block text-sm font-semibold">
              Código de {TWO_FACTOR_LIMITS.codeLength} dígitos
              <input
                // `one-time-code` hace que el teléfono ofrezca el código del
                // correo sin salir del formulario.
                autoComplete="one-time-code"
                className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-center font-mono text-xl font-bold tracking-[0.4em] outline-none focus:border-primary"
                inputMode="numeric"
                maxLength={TWO_FACTOR_LIMITS.codeLength}
                name="code"
                pattern={`\\d{${TWO_FACTOR_LIMITS.codeLength}}`}
                required
              />
            </label>

            <p className="text-xs text-muted-foreground">
              El código vence en {TWO_FACTOR_EXPIRES_IN_MINUTES} minutos y sirve una sola vez.
            </p>

            <button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
              Verificar y entrar
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <form action={resendAdminTwoFactorCode}>
              <input name="next" type="hidden" value={nextPath} />
              <button className="text-xs font-semibold text-primary hover:underline">
                Enviar un código nuevo
              </button>
            </form>

            <form action={cancelAdminTwoFactorLogin}>
              <button className="text-xs font-semibold text-muted-foreground hover:underline">
                Cancelar
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    rate_limited: "Demasiados intentos. Espera unos minutos antes de intentar de nuevo.",
    two_factor_invalid: "El código no es válido o ya venció. Pide uno nuevo.",
    two_factor_sent: "Te enviamos un código nuevo. Revisa tu correo.",
  };

  return messages[status] ?? "";
}
