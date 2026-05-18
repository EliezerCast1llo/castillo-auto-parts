import type { MockProduct } from "@/data/mock-products";

export function StockBadge({ status }: { status: MockProduct["stockStatus"] }) {
  const styles = {
    "En stock": "bg-success/10 text-success",
    "Bajo stock": "bg-accent/20 text-accent-foreground",
    Preorder: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
