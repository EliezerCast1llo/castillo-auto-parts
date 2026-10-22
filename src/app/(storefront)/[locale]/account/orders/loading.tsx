import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeaderSkeleton } from "@/components/site-header-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeaderSkeleton />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-40" />
        <Skeleton className="mt-4 h-40" />
      </div>
    </main>
  );
}
