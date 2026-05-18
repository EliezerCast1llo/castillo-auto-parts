import type { CatalogProduct } from "@/data/products";

export function StockBadge({ status }: { status: CatalogProduct["stockStatus"] }) {
  const styles = {
    Disponible: "bg-success/10 text-success",
    "Últimas unidades": "bg-warning/10 text-warning",
    "No disponible": "bg-danger/10 text-danger",
  };

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
