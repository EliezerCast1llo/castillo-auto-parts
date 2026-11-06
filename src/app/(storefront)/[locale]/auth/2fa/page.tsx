import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { maskEmail } from "@/lib/customer-credentials";
import { db } from "@/lib/db";
import { asLocaleHref, redirect } from "@/lib/i18n/navigation";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getStatusMessage } from "@/lib/i18n/status";
import { TWO_FACTOR_LIMITS } from "@/lib/two-factor";
import { readPendingTwoFactorCookie } from "@/lib/two-factor-cookie";
import { TWO_FACTOR_EXPIRES_IN_MINUTES } from "@/lib/two-factor-delivery";
import { firstValue } from "@/lib/url-utils";
import { cancelTwoFactorLogin, resendTwoFactorCode, verifyTwoFactorLogin } from "./actions";

export const dynamic = "force-dynamic";

/** El único estado de esta pantalla que es una buena noticia. */
const SUCCESS_STATUS = "two_factor_sent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth.twoFactor" });

  return {
    robots: { follow: false, index: false },
    title: t("metadataTitle"),
  };
}

type TwoFactorPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TwoFactorPage({
  params: routeParams,
  searchParams,
}: TwoFactorPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const t = await getTranslations({ locale, namespace: "Auth.twoFactor" });
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeCustomerNextPath(firstValue(params.next));

  // Ya hay sesión: el código se usó y esta pantalla no tiene nada que pedir.
  const session = await auth();
  if (session?.user) redirect({ href: asLocaleHref(nextPath), locale });

  const pending = await readPendingTwoFactorCookie();

  // Sin desafío pendiente no hay nada que verificar. Se vuelve al ingreso en vez
  // de mostrar un formulario que fallaría siempre.
  if (!pending) {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_restart", next: nextPath } },
      locale,
    });
  }

  const user = await db.user.findUnique({
    where: { id: pending.userId },
    select: { email: true },
  });

  if (!user) {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_restart", next: nextPath } },
      locale,
    });
  }

  const estado = firstValue(params.estado);
  const statusMessage = await getStatusMessage("auth", estado, locale);
  const isSuccess = estado === SUCCESS_STATUS;

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ca-navy-950 text-white shadow-ca-button-hover">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                {t("eyebrow")}
              </p>
              <h1 className="text-2xl font-black text-ca-navy-950">{t("title")}</h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-ca-border bg-white p-6 shadow-ca-premium">
            {statusMessage ? (
              <div
                className={
                  isSuccess
                    ? "mb-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"
                    : "mb-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600"
                }
              >
                {statusMessage}
              </div>
            ) : null}

            <p className="text-sm font-medium leading-6 text-ca-text-secondary">
              {t("description", { email: maskEmail(user.email) })}
            </p>

            <form action={verifyTwoFactorLogin} className="mt-5 space-y-4">
              <input type="hidden" name="next" value={nextPath} />

              <div>
                <label htmlFor="code" className="block text-sm font-bold text-ca-navy-950">
                  {t("codeLabel")}
                </label>
                <input
                  id="code"
                  name="code"
                  required
                  // `one-time-code` es lo que hace que el teléfono ofrezca el
                  // código del correo sin salir del formulario.
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern={`\\d{${TWO_FACTOR_LIMITS.codeLength}}`}
                  maxLength={TWO_FACTOR_LIMITS.codeLength}
                  className="mt-2 h-14 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-ca-navy-950 outline-none focus:border-ca-navy-950"
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">
                  {t("codeHelper", { minutes: TWO_FACTOR_EXPIRES_IN_MINUTES })}
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex h-[52px] w-full items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button-hover transition hover:bg-ca-navy-800"
              >
                {t("submit")}
              </button>
            </form>

            <div className="my-5 h-px bg-ca-border" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <form action={resendTwoFactorCode}>
                <input type="hidden" name="next" value={nextPath} />
                <button
                  type="submit"
                  className="text-xs font-bold text-ca-blue-700 hover:underline"
                >
                  {t("resend")}
                </button>
              </form>

              <form action={cancelTwoFactorLogin}>
                <input type="hidden" name="next" value={nextPath} />
                <button
                  type="submit"
                  className="text-xs font-bold text-ca-text-secondary hover:underline"
                >
                  {t("cancel")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
