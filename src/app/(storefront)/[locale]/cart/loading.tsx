import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeaderSkeleton />

      <div className="ca-container py-6">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </main>
  );
}
