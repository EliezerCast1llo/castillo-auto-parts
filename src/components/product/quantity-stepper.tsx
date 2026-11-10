"use client";

import { buttonVariants } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type QuantityStepperProps = {
  defaultValue?: number;
  disabled?: boolean;
  max?: number;
  min?: number;
  name?: string;
};

export function QuantityStepper({
  defaultValue,
  disabled = false,
  max = 99,
  min = 1,
  name = "quantity",
}: QuantityStepperProps) {
  const t = useTranslations("Cart");
  const safeMin = disabled ? 0 : Math.max(min, 0);
  const safeMax = Math.max(max, safeMin);
  const initialQuantity = disabled
    ? 0
    : Math.min(Math.max(defaultValue ?? safeMin, safeMin), safeMax);
  const [rawQuantity, setRawQuantity] = useState(String(initialQuantity));
  const quantity = Number(rawQuantity) || safeMin;

  function updateQuantity(nextValue: number) {
    if (disabled) return;
    setRawQuantity(String(clampQuantity(nextValue, safeMin, safeMax)));
  }

  function handleInputChange(value: string) {
    if (disabled) return;

    if (value === "") {
      setRawQuantity("");
      return;
    }

    const nextValue = Number(value);
    if (Number.isFinite(nextValue)) {
      setRawQuantity(String(clampQuantity(nextValue, safeMin, safeMax)));
    }
  }

  return (
    <div className="flex h-11 overflow-hidden rounded-ca-control border border-border bg-background">
      <button
        aria-label={t("quantity.decrease")}
        className={buttonVariants({ variant: "outline", className: "h-full w-11 shrink-0 border-0 px-0 focus-visible:-outline-offset-2" })}
        disabled={disabled || quantity <= safeMin}
        onClick={() => updateQuantity(quantity - 1)}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        aria-label={t("quantityControl.quantityAriaLabel")}
        className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-semibold"
        disabled={disabled}
        inputMode="numeric"
        max={safeMax}
        min={safeMin}
        name={name}
        onBlur={() => {
          if (rawQuantity === "") updateQuantity(safeMin);
        }}
        onChange={(event) => handleInputChange(event.target.value)}
        type="number"
        value={rawQuantity}
      />
      <button
        aria-label={t("quantity.increase")}
        className={buttonVariants({ variant: "outline", className: "h-full w-11 shrink-0 border-0 px-0 focus-visible:-outline-offset-2" })}
        disabled={disabled || quantity >= safeMax}
        onClick={() => updateQuantity(quantity + 1)}
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function clampQuantity(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.trunc(value), min), max);
}
