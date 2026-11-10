import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Este 404 vive fuera de los route groups, así que Next lo monta bajo un layout
// builtin que no carga los estilos globales: hay que importarlos acá.
import "./globals.css";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ca-bg px-4 text-ca-text">
      <div className="w-full max-w-md rounded-ca-surface border border-ca-border bg-ca-surface p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-ca-control bg-ca-navy text-white">
          <SearchX className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-bold text-ca-text-secondary">
          Error 404
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ca-navy">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-ca-text-secondary">
          El enlace puede estar vencido o el producto ya no está disponible. Revisa el catálogo para
          encontrar el repuesto que buscas.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className={buttonVariants({ variant: "primary" })} href="/catalog">
            Ir al catálogo
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline" }), "font-bold")} href="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
