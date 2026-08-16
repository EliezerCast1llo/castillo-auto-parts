import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CatalogProduct } from "@/data/products";

const badgeConfig = {
  Disponible: {
    className: "text-success",
    Icon: CheckCircle2,
  },
  "Últimas unidades": {
    className: "text-warning",
    Icon: AlertTriangle,
  },
  "No disponible": {
    className: "text-danger",
    Icon: XCircle,
  },
} as const;

export function StockBadge({ status }: { status: CatalogProduct["stockStatus"] }) {
  const { className, Icon } = badgeConfig[status];

  return (
    <span
      aria-label={`Disponibilidad del repuesto: ${status}`}
      className={`inline-flex items-center gap-1 text-xs font-bold ${className}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {status}
    </span>
  );
}
