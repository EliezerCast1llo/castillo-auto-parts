import type { CatalogProduct } from "@/data/products";

export function StockBadge({ status }: { status: CatalogProduct["stockStatus"] }) {
  const styles = {
    Disponible: "border-success/15 bg-success/10 text-success",
    "Últimas unidades": "border-warning/20 bg-warning/10 text-warning",
    "No disponible": "border-danger/15 bg-[#FBEAEA] text-danger",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${styles[status]}`}>
      {status}
    </span>
  );
}
