import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Precio de producto en Outfit semibold.
 *
 * Va en la fuente de cuerpo y no en la display a propósito: Barlow Condensed
 * es una condensada pensada para titulares, y en peso negro a 20px cierra las
 * contraformas de las cifras (8, 9, 6, 0) hasta volverlas difíciles de leer.
 * La display sigue en titulares, logo y botones, que es donde está la voz de
 * la marca; los datos van en la tipografía de texto.
 */
export function ProductPrice({
  cents,
  className,
  size = "md",
}: {
  cents: number;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <p
      className={cn(
        "font-sans font-semibold leading-none text-ca-navy-950",
        size === "lg" ? "text-3xl" : "text-xl",
        className,
      )}
    >
      {formatCurrency(cents)}
    </p>
  );
}
