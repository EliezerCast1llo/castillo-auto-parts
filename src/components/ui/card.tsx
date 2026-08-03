import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitiva de tarjeta del design system: el contenedor blanco redondeado
 * repetido en catálogo, PDP, cuenta y checkout.
 */
export const cardVariants = cva("rounded-2xl border border-ca-border bg-white", {
  variants: {
    shadow: {
      soft: "shadow-ca-soft",
      premium: "shadow-ca-premium",
      none: "",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: {
    shadow: "soft",
    padding: "md",
  },
});

export type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, shadow, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ shadow, padding }), className)} {...props} />;
}
