"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTransition, useState } from "react";
import { removeCartItem, updateCartItem } from "@/app/cart/actions";

type CartQuantityControlProps = {
  sku: string;
  initialQuantity: number;
  max: number;
  disabled?: boolean;
};

export function CartQuantityControl({
  sku,
  initialQuantity,
  max,
  disabled = false,
}: CartQuantityControlProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [pending, startTransition] = useTransition();

  function submit(nextQty: number) {
    const clamped = Math.min(Math.max(nextQty, 1), max);
    setQuantity(clamped);
    const fd = new FormData();
    fd.set("sku", sku);
    fd.set("quantity", String(clamped));
    startTransition(() => updateCartItem(fd));
  }

  function handleRemove() {
    const fd = new FormData();
    fd.set("sku", sku);
    startTransition(() => removeCartItem(fd));
  }

  const canDecrease = !disabled && quantity > 1;
  const canIncrease = !disabled && quantity < max;

  return (
    <div className={`flex items-center gap-3 transition-opacity ${pending ? "opacity-50" : ""}`}>
      {/* Stepper */}
      <div className="flex h-10 items-center overflow-hidden rounded-xl border border-ca-border bg-white">
        <button
          aria-label="Disminuir cantidad"
          className="flex w-10 items-center justify-center text-ca-navy-950 transition hover:bg-ca-background disabled:text-ca-border"
          disabled={!canDecrease || pending}
          onClick={() => submit(quantity - 1)}
          type="button"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
        <span className="min-w-[2rem] px-2 text-center text-sm font-black text-ca-navy-950">
          {quantity}
        </span>
        <button
          aria-label="Aumentar cantidad"
          className="flex w-10 items-center justify-center text-ca-navy-950 transition hover:bg-ca-background disabled:text-ca-border"
          disabled={!canIncrease || pending}
          onClick={() => submit(quantity + 1)}
          type="button"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>

      {/* Spinner discreto mientras actualiza */}
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ca-navy-950 border-t-transparent" />
      ) : null}

      {/* Eliminar */}
      <button
        aria-label="Eliminar del carrito"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ca-border px-3 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
        disabled={pending}
        onClick={handleRemove}
        type="button"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Eliminar</span>
      </button>
    </div>
  );
}
