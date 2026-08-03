import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { CatalogProduct } from "@/data/products";

const badgeConfig = {
  Disponible: {
    className: "border-success/15 bg-success/10 text-success",
    Icon: CheckCircle2,
  },
  "Últimas unidades": {
    className: "border-warning/20 bg-warning/10 text-warning",
    Icon: AlertTriangle,
  },
  "No disponible": {
    className: "border-danger/15 bg-[#FBEAEA] text-danger",
    Icon: XCircle,
  },
} as const;

export function StockBadge({ status }: { status: CatalogProduct["stockStatus"] }) {
  const { className, Icon } = badgeConfig[status];

  return (
    <span
      aria-label={`Disponibilidad: ${status}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${className}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {status}
    </span>
  );
}
