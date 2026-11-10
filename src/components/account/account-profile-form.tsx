import { buttonVariants } from "@/components/ui/button";
import { Save, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

type AccountProfileFormProps = {
  action: (formData: FormData) => Promise<void>;
  email: string | null;
  locale: Locale;
  name: string | null;
  phone: string | null;
};

export async function AccountProfileForm({
  action,
  email,
  locale,
  name,
  phone,
}: AccountProfileFormProps) {
  const t = await getTranslations({ locale, namespace: "Account.profile" });

  return (
    <section className="h-full rounded-ca-surface border border-ca-border bg-ca-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy">
          <User className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ca-navy">{t("title")}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-ca-text-secondary">
            {t("description")}
          </p>
        </div>
      </div>

      <form action={action} className="mt-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField
            helper={t("nameHelper")}
            label={t("nameLabel")}
            value={name || "Nombre no disponible"}
          />
          <ReadOnlyField
            helper={t("emailHelper")}
            label={t("emailLabel")}
            value={email || "Correo no disponible"}
          />
        </div>

        <div>
          <label htmlFor="account-phone" className="block text-sm font-bold text-ca-navy">
            {t("phoneLabel")}
          </label>
          <div className="mt-2 flex min-h-12 overflow-hidden rounded-ca-control border border-ca-border bg-ca-bg transition focus-within:border-ca-navy focus-within:ring-2 focus-within:ring-ca-navy/10">
            <span className="flex shrink-0 items-center border-r border-ca-border bg-ca-surface px-3 text-sm font-bold text-ca-navy">
              +503
            </span>
            <input
              autoComplete="tel"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-ca-navy placeholder:text-ca-text-secondary/60"
              defaultValue={phone ?? ""}
              id="account-phone"
              name="phone"
              placeholder="7000-0000"
              type="tel"
            />
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">
            {t("phoneHelper")}
          </p>
        </div>

        <button
          className={buttonVariants({ className: "w-full sm:w-auto" })}
          type="submit"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          {t("save")}
        </button>
      </form>
    </section>
  );
}

function ReadOnlyField({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-ca-navy">{label}</p>
      <div
        aria-label={label}
        className="mt-2 flex min-h-12 items-center rounded-ca-control border border-ca-border bg-ca-bg px-3 text-sm font-semibold text-ca-text-secondary"
        role="group"
      >
        <span className="line-clamp-2 break-words">{value}</span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-ca-text-secondary">{helper}</p>
    </div>
  );
}
