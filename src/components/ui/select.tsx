import { cva, type VariantProps } from "class-variance-authority";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitiva de select del design system. Mismo lenguaje visual que Input:
 * fondo gris, borde azul en focus.
 */
export const selectVariants = cva(
  "w-full rounded-ca-control border border-ca-border bg-ca-background px-3 text-sm font-bold text-ca-navy-950 outline-none transition focus:border-ca-blue-700 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      size: {
        md: "h-11",
        lg: "h-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> &
  VariantProps<typeof selectVariants>;

export function Select({ className, size, ...props }: SelectProps) {
  return <select className={cn(selectVariants({ size }), className)} {...props} />;
}
