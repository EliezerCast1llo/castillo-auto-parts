import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-72" />

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
          <div className="space-y-4">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-[480px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
