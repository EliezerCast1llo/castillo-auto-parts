import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CatalogProduct } from "@/data/products";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

const badgeConfig = {
  IN_STOCK: {
    className: "text-success",
    Icon: CheckCircle2,
  },
  LOW_STOCK: {
    className: "text-warning",
    Icon: AlertTriangle,
  },
  OUT_OF_STOCK: {
    className: "text-danger",
    Icon: XCircle,
  },
} as const;

export async function StockBadge({
  locale,
  status,
}: {
  locale: Locale;
  status: CatalogProduct["stockStatus"];
}) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const { className, Icon } = badgeConfig[status];
  // `formatStockStatus` se queda para el admin, que es solo en español; acá el
  // enum ya era una clave independiente del idioma.
  const label = t(`stockStatus.${status}`);

  return (
    <span
      aria-label={t("stockAriaLabel", { status: label })}
      className={`inline-flex items-center gap-1 text-xs font-bold ${className}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {label}
    </span>
  );
}
