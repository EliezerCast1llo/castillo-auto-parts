import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder del header para los `loading.tsx`.
 *
 * El header real necesita saber el idioma, y `loading.tsx` no recibe los params
 * de la ruta: renderizarlo ahí obligaba a asumir un idioma, y con streaming ese
 * primer flush es exactamente lo que ve el visitante — un menú en español sobre
 * una página en inglés.
 *
 * Un esqueleto tampoco debería mostrar texto definitivo: reserva el alto del
 * header para que no haya salto de layout cuando llega el real, y nada más.
 */
export function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-50 border-b border-ca-border bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-9 shrink-0 rounded-[10px]" />
        <Skeleton className="hidden h-9 w-32 sm:block" />
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="hidden h-10 w-56 lg:block" />
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
