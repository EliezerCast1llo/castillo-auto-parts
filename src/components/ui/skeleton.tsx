import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ca-border/60", className)} />;
}

/** Skeleton con la geometría de ProductCard para los grids de catálogo. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ca-border bg-white shadow-ca-soft">
      <Skeleton className="h-44 rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <div className="mt-auto flex items-center justify-between border-t border-ca-border pt-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
