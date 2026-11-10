import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeaderSkeleton />

      <div className="ca-container py-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-40" />
        <Skeleton className="mt-4 h-40" />
      </div>
    </main>
  );
}
