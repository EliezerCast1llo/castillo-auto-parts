import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitiva de input del design system. Variantes tomadas de los patrones
 * repetidos en filtros, auth y checkout (fondo gris que se aclara en focus).
 */
export const inputVariants = cva(
  "w-full rounded-ca-control border border-ca-border bg-ca-background px-3 text-sm font-semibold text-ca-navy-950 outline-none transition placeholder:text-ca-text-secondary focus:border-ca-blue-700 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
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

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants>;

export function Input({ className, size, ...props }: InputProps) {
  return <input className={cn(inputVariants({ size }), className)} {...props} />;
}
