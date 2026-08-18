"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { addCartItemInline, type AddCartItemInlineState } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STATUS_MESSAGES: Record<
  NonNullable<AddCartItemInlineState>["status"],
  { message: string; tone: "success" | "error" }
> = {
  added: { message: "Repuesto agregado al carrito", tone: "success" },
  quantity_adjusted: {
    message: "Agregado; ajustamos la cantidad a la disponibilidad actual",
    tone: "success",
  },
  unavailable: { message: "Este repuesto no está disponible por ahora", tone: "error" },
  invalid: { message: "No pudimos agregar el repuesto al carrito", tone: "error" },
};

type AddToCartFormProps = {
  sku: string;
  available: boolean;
  /** Controles extra dentro del form (p.ej. QuantityStepper). Si no hay, se envía quantity=1. */
  children?: ReactNode;
  label?: string;
  /**
   * Nombre del producto, solo como contexto para lectores de pantalla. El
   * nombre accesible lo compone este componente como `${label}: ${productName}`
   * para que siempre empiece por el texto visible del botón; construirlo en
   * cada card llevaba a nombres tipo "Agregar X al carrito", que no contienen
   * el texto visible en orden y rompen `label-content-name-mismatch`.
   */
  productName?: string;
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
  label = "Agregar al carrito",
  productName,
  unavailableLabel = "No disponible por ahora",
  className,
  buttonClassName,
  buttonSize = "md",
}: AddToCartFormProps) {
  // El texto visible va primero y literal; el producto queda como sufijo.
  const accessibleName =
    available && productName ? `${label}: ${productName}` : undefined;

  const [state, formAction, pending] = useActionState(addCartItemInline, null);
  const lastHandledAtRef = useRef<number | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!state || state.at === lastHandledAtRef.current) return;
    lastHandledAtRef.current = state.at;

    const feedback = STATUS_MESSAGES[state.status];
    showToast(feedback.message, feedback.tone);

    if (feedback.tone === "success") {
      // Actualiza el badge del carrito en SiteHeader (server component)
      router.refresh();
    }
  }, [state, router, showToast]);

  return (
    <form action={formAction} className={className}>
      <input name="sku" type="hidden" value={sku} />
      {children ?? <input name="quantity" type="hidden" value="1" />}
      <Button
        aria-label={accessibleName}
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
        {available ? label : unavailableLabel}
      </Button>
    </form>
  );
}
