import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

export default function VehicleMakeLoading() {
  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeaderSkeleton />

      <div className="ca-container py-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="mt-5 h-32" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
