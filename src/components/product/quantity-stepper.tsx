"use client";

import { Minus, Plus } from "lucide-react";
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
    <div className="flex h-11 overflow-hidden rounded-md border border-border bg-background">
      <button
        aria-label="Disminuir cantidad"
        className="flex w-11 items-center justify-center border-r border-border text-primary disabled:text-muted-foreground"
        disabled={disabled || quantity <= safeMin}
        onClick={() => updateQuantity(quantity - 1)}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        aria-label="Cantidad"
        className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-semibold outline-none"
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
        aria-label="Aumentar cantidad"
        className="flex w-11 items-center justify-center border-l border-border text-primary disabled:text-muted-foreground"
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
