import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeaderSkeleton />

      <div className="ca-container py-5">
        <Skeleton className="h-5 w-72" />

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
          <div className="space-y-4">
            <Skeleton className="h-[420px] rounded-ca-control" />
            <Skeleton className="h-32 rounded-ca-control" />
          </div>
          <Skeleton className="h-[480px] rounded-ca-control" />
        </div>
      </div>
    </main>
  );
}
