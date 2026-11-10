import { buttonVariants } from "@/components/ui/button";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

type AccountPasswordFormProps = {
  action: (formData: FormData) => Promise<void>;
  hasPassword: boolean;
  locale: Locale;
};

export async function AccountPasswordForm({
  action,
  hasPassword,
  locale,
}: AccountPasswordFormProps) {
  const t = await getTranslations({ locale, namespace: "Account.password" });

  return (
    <section className="h-full rounded-ca-surface border border-ca-border bg-ca-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy">
          <Lock className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ca-navy">{t("title")}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-ca-text-secondary">
            {t("description")}
          </p>
        </div>
      </div>

      {hasPassword ? (
        <form action={action} className="mt-6 space-y-5">
          <PasswordField
            autoComplete="current-password"
            label={t("currentLabel")}
            name="currentPassword"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              helper={t("newHelper")}
              label={t("newLabel")}
              minLength={8}
              name="newPassword"
            />
            <PasswordField
              autoComplete="new-password"
              label={t("confirmLabel")}
              minLength={8}
              name="confirmPassword"
            />
          </div>
          <button
            className={buttonVariants({ className: "w-full sm:w-auto" })}
            type="submit"
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
            {t("submit")}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-ca-control border border-ca-border bg-ca-bg p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-surface text-ca-navy">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-bold text-ca-navy">
                {t("providerTitle")}
              </p>
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

function PasswordField({
  autoComplete,
  helper,
  label,
  minLength,
  name,
}: {
  autoComplete: string;
  helper?: string;
  label: string;
  minLength?: number;
  name: string;
}) {
  const id = `account-${name}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-ca-navy">
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-12 w-full rounded-ca-control border border-ca-border bg-ca-bg px-3 text-sm font-semibold text-ca-navy transition focus:border-ca-navy focus:ring-2 focus:ring-ca-navy/10"
        id={id}
        minLength={minLength}
        name={name}
        required
        type="password"
      />
      {helper ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">{helper}</p>
      ) : null}
    </div>
  );
}
