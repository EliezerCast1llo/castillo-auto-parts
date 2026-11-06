import { ShieldCheck, ShieldOff, ShieldQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

type AccountTwoFactorFormProps = {
  action: (formData: FormData) => Promise<void>;
  enabled: boolean;
  /**
   * Solo las cuentas con contraseña propia ven el interruptor: el ingreso con
   * Google no pasa por el código, así que ahí el control no haría nada.
   */
  hasPassword: boolean;
  locale: Locale;
};

export async function AccountTwoFactorForm({
  action,
  enabled,
  hasPassword,
  locale,
}: AccountTwoFactorFormProps) {
  const t = await getTranslations({ locale, namespace: "Account.twoFactor" });

  return (
    <section className="h-full rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ca-background text-ca-navy-950">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ca-navy-950">{t("title")}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
            {t("description")}
          </p>
        </div>
      </div>

      {hasPassword ? (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />

          <div className="flex items-center gap-2">
            <span
              className={
                enabled
                  ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                  : "inline-flex items-center gap-1.5 rounded-full bg-ca-background px-3 py-1 text-xs font-black text-ca-text-secondary"
              }
            >
              {enabled ? (
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
              ) : (
                <ShieldOff className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
              {enabled ? t("statusOn") : t("statusOff")}
            </span>
          </div>

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ca-navy-950 bg-white px-5 text-sm font-black text-ca-navy-950 transition hover:bg-ca-navy-950 hover:text-white sm:w-auto"
            type="submit"
          >
            {enabled ? t("disable") : t("enable")}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-ca-border bg-ca-background p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ca-navy-950">
              <ShieldQuestion className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-black text-ca-navy-950">{t("providerTitle")}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-ca-text-secondary">
                {t("providerDescription")}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
