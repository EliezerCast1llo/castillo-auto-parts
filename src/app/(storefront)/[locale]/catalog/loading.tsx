import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";

export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <Skeleton className="h-[420px]" />
          </aside>

          <section className="min-w-0 space-y-5">
            <Skeleton className="h-24" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
