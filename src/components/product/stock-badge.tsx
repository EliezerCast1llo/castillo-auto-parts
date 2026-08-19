import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CatalogProduct } from "@/data/products";
import { formatStockStatus } from "@/lib/stock-status";

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

export function StockBadge({ status }: { status: CatalogProduct["stockStatus"] }) {
  const { className, Icon } = badgeConfig[status];
  const label = formatStockStatus(status);

  return (
    <span
      aria-label={`Disponibilidad del repuesto: ${label}`}
      className={`inline-flex items-center gap-1 text-xs font-bold ${className}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {label}
    </span>
  );
}
