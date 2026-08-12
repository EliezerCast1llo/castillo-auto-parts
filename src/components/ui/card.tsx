import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitiva de tarjeta del design system: el contenedor blanco redondeado
 * repetido en catálogo, PDP, cuenta y checkout.
 */
export const cardVariants = cva("rounded-ca-surface border border-ca-border bg-white", {
  variants: {
    // Las superficies planas no llevan sombra; `overlay` queda para lo que de
    // verdad flota sobre la página (modales, drawers).
    shadow: {
      none: "",
      overlay: "shadow-ca-overlay",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: {
    shadow: "none",
    padding: "md",
  },
});

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, shadow, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ shadow, padding }), className)} {...props} />;
}
