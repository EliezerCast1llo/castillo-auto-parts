import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-ca-control border border-transparent font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ca-navy-hover disabled:pointer-events-none disabled:border-ca-border disabled:bg-ca-bg disabled:text-ca-text-secondary",
  {
    variants: {
      variant: {
        primary: "bg-ca-navy text-white hover:bg-ca-navy-hover",
        outline: "border-ca-border bg-ca-surface text-ca-navy hover:border-ca-navy hover:bg-ca-bg",
        ghost: "text-ca-text-secondary hover:bg-ca-bg hover:text-ca-navy",
        whatsapp: "border-ca-whatsapp bg-ca-surface text-ca-navy hover:bg-ca-whatsapp/10",
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

type ButtonStyleProps = VariantProps<typeof buttonStyles> & { className?: string };

/** Use buttonVariants for links that look like buttons. */
export function buttonVariants({ className, ...variants }: ButtonStyleProps = {}) {
  return cn(buttonStyles(variants), className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
