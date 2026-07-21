import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitiva de botón del design system. Variantes tomadas de los patrones
 * repetidos en el sitio (navy primario, gold de acento, outline del header).
 *
 * Para enlaces con apariencia de botón usar `buttonVariants()` directamente
 * en el className del <Link>.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ca-blue-700 disabled:pointer-events-none disabled:bg-ca-disabled-bg disabled:text-ca-disabled-text disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ca-navy-950 text-white shadow-ca-button hover:bg-ca-navy-800 hover:shadow-ca-button-hover",
        accent:
          "bg-ca-gold-400 text-ca-navy-950 shadow-ca-button hover:bg-ca-gold-500 hover:shadow-ca-button-hover",
        outline:
          "border border-ca-border bg-white text-ca-navy-950 hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white",
        ghost: "font-bold text-ca-text-secondary hover:text-ca-navy-950",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
