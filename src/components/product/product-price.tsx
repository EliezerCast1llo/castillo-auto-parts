import { formatCurrencyParts } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Precio con tipografía de retail: el entero domina y símbolo y centavos van
 * arriba, más pequeños. Da al precio un peso visual distinto al del resto del
 * texto de la tarjeta, donde antes todo competía en el mismo negro.
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
  const { currency, integer, fraction } = formatCurrencyParts(cents);
  const integerSize = size === "lg" ? "text-4xl" : "text-2xl";
  const affixSize = size === "lg" ? "text-lg" : "text-sm";

  return (
    <p className={cn("flex items-start font-display font-black text-ca-navy-950", className)}>
      <span className={cn(affixSize, "mt-0.5")}>{currency}</span>
      <span className={cn(integerSize, "leading-none tracking-tight")}>{integer}</span>
      {fraction ? <span className={cn(affixSize, "mt-0.5")}>{fraction}</span> : null}
    </p>
  );
}
