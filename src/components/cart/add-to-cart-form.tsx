"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { addCartItemInline, type AddCartItemInlineState } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Tono de cada resultado, y la clave con la que se busca su texto.
 *
 * El tono se queda acá y el texto no: el tono es comportamiento —decide de qué
 * color sale el toast— y no cambia con el idioma.
 */
const STATUS_FEEDBACK: Record<
  NonNullable<AddCartItemInlineState>["status"],
  { key: "added" | "quantityAdjusted" | "notAvailable" | "failed"; tone: "success" | "error" }
> = {
  added: { key: "added", tone: "success" },
  quantity_adjusted: { key: "quantityAdjusted", tone: "success" },
  unavailable: { key: "notAvailable", tone: "error" },
  invalid: { key: "failed", tone: "error" },
};

type AddToCartFormProps = {
  sku: string;
  available: boolean;
  /** Controles extra dentro del form (p.ej. QuantityStepper). Si no hay, se envía quantity=1. */
  children?: ReactNode;
  /** Sobrescribe el texto del botón; sin esto se usa el traducido. */
  label?: string;
  buttonAriaLabel?: string;
  unavailableLabel?: string;
  className?: string;
  buttonClassName?: string;
  buttonSize?: "sm" | "md" | "lg";
};

/**
 * Form de agregar al carrito sin redirect: muestra toast, permanece en la
 * página y refresca el contador del header vía router.refresh().
 */
export function AddToCartForm({
  sku,
  available,
  children,
  label,
  buttonAriaLabel,
  unavailableLabel,
  className,
  buttonClassName,
  buttonSize = "md",
}: AddToCartFormProps) {
  const t = useTranslations("Cart.addToCart");
  const [state, formAction, pending] = useActionState(addCartItemInline, null);
  const lastHandledAtRef = useRef<number | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!state || state.at === lastHandledAtRef.current) return;
    lastHandledAtRef.current = state.at;

    const feedback = STATUS_FEEDBACK[state.status];
    showToast(t(feedback.key), feedback.tone);

    if (feedback.tone === "success") {
      // Actualiza el badge del carrito en SiteHeader (server component)
      router.refresh();
    }
  }, [state, router, showToast, t]);

  return (
    <form action={formAction} className={className}>
      <input name="sku" type="hidden" value={sku} />
      {children ?? <input name="quantity" type="hidden" value="1" />}
      <Button
        aria-label={available ? buttonAriaLabel : undefined}
        type="submit"
        size={buttonSize}
        disabled={!available || pending}
        className={cn("w-full", buttonClassName)}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <ShoppingCart className="h-4 w-4" strokeWidth={2} />
        )}
        {available ? (label ?? t("label")) : (unavailableLabel ?? t("unavailable"))}
      </Button>
    </form>
  );
}
