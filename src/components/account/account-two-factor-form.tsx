import { buttonVariants } from "@/components/ui/button";
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
    <section className="h-full rounded-ca-surface border border-ca-border bg-ca-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ca-navy">{t("title")}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-ca-text-secondary">
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
                  ? "inline-flex items-center gap-1.5 rounded-ca-control bg-ca-surface px-3 py-1 text-xs font-bold text-success"
                  : "inline-flex items-center gap-1.5 rounded-ca-control bg-ca-bg px-3 py-1 text-xs font-bold text-ca-text-secondary"
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
            className={buttonVariants({ className: "w-full sm:w-auto" })}
            type="submit"
          >
            {enabled ? t("disable") : t("enable")}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-ca-control border border-ca-border bg-ca-bg p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-surface text-ca-navy">
              <ShieldQuestion className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-bold text-ca-navy">{t("providerTitle")}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-ca-text-secondary">
                {t("providerDescription")}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
