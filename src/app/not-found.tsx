import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Este 404 vive fuera de los route groups, así que Next lo monta bajo un layout
// builtin que no carga los estilos globales: hay que importarlos acá.
import "./globals.css";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ca-background px-4 text-ca-text-primary">
      <div className="w-full max-w-md rounded-2xl border border-ca-border bg-white p-8 text-center shadow-ca-premium">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ca-navy-950 text-white">
          <SearchX className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-widest text-ca-gold-500">
          Error 404
        </p>
        <h1 className="mt-1 font-display text-2xl font-black text-ca-navy-950">
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
