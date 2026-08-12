import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Precio de producto. Un solo tamaño y con separador decimal: la variante
 * de retail (entero grande, centavos en superíndice) se probó y a la escala
 * de la tarjeta se leía ambigua, porque "12" y "95" quedaban pegados con
 * tamaños distintos y sin punto que los separara. El peso visual lo dan el
 * cuerpo y la tipografía display, no el truco del superíndice.
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
        "font-display font-black leading-none text-ca-navy-950",
        size === "lg" ? "text-3xl" : "text-xl",
        className,
      )}
    >
      {formatCurrency(cents)}
    </p>
  );
}
