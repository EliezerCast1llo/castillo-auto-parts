"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CANONICAL_MAKES, splitMakeAndModel } from "@/data/vehicle-catalog";

type CompatibilityRow = {
  id: number;
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  /** Marca escrita a mano (fuera de la lista canónica). */
  custom: boolean;
};

type CompatibilityEditorProps = {
  defaultCompatibilities: Array<{
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
  }>;
};

const CUSTOM_MAKE = "__custom__";

/**
 * Editor estructurado de compatibilidades vehiculares.
 *
 * Serializa las filas completas al formato de texto que ya entiende
 * `parseCompatibilityLines` ("Marca Modelo YYYY-YYYY") en un input oculto
 * `compatibilities`, así la server action no cambia. El "modo texto" expone
 * el textarea original como fallback.
 */
export function CompatibilityEditor({ defaultCompatibilities }: CompatibilityEditorProps) {
  const [rows, setRows] = useState<CompatibilityRow[]>(() => {
    const initial = rowsFromDefaults(defaultCompatibilities);
    return initial.length > 0 ? initial : [emptyRow(0)];
  });
  const [nextId, setNextId] = useState(defaultCompatibilities.length + 1);
  const [textMode, setTextMode] = useState(false);
  const [textValue, setTextValue] = useState(() => serializeRows(rowsFromDefaults(defaultCompatibilities)));

  function updateRow(id: number, patch: Partial<CompatibilityRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(nextId)]);
    setNextId((current) => current + 1);
  }

  function removeRow(id: number) {
    setRows((current) =>
      current.length > 1
        ? current.filter((row) => row.id !== id)
        : current.map((row) => (row.id === id ? emptyRow(row.id) : row)),
    );
  }

  if (textMode) {
    return (
      <div className="text-sm font-semibold">
        <EditorHeader
          modeLabel="Usar editor estructurado"
          onToggle={() => {
            setRows(parseTextToRows(textValue, nextId, setNextId));
            setTextMode(false);
          }}
        />
        <textarea
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          name="compatibilities"
          onChange={(event) => setTextValue(event.target.value)}
          placeholder="Toyota Corolla 2009-2022"
          rows={4}
          value={textValue}
        />
        <p className="mt-1 text-xs font-normal text-muted-foreground">
          Una línea por vehículo: Marca Modelo AñoDesde-AñoHasta.
        </p>
      </div>
    );
  }

  return (
    <div className="text-sm font-semibold">
      <EditorHeader
        modeLabel="Usar modo texto"
        onToggle={() => {
          setTextValue(serializeRows(rows));
          setTextMode(true);
        }}
      />
      <input name="compatibilities" type="hidden" value={serializeRows(rows)} />

      <div className="mt-2 space-y-2">
        {rows.map((row) => {
          const isCustomMake =
            row.custom || (Boolean(row.make) && !CANONICAL_MAKES.some((make) => make === row.make));
          const invalidYears =
            row.yearFrom !== "" && row.yearTo !== "" && Number(row.yearFrom) > Number(row.yearTo);

          return (
            <div key={row.id} className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_90px_90px_36px] sm:items-center">
              <div className="flex gap-2">
                <select
                  aria-label="Marca de vehículo"
                  className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
                  onChange={(event) => {
                    const value = event.target.value;
                    updateRow(
                      row.id,
                      value === CUSTOM_MAKE
                        ? { make: "", custom: true }
                        : { make: value, custom: false },
                    );
                  }}
                  value={isCustomMake ? CUSTOM_MAKE : row.make}
                >
                  <option value="">Marca</option>
                  {CANONICAL_MAKES.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                  <option value={CUSTOM_MAKE}>Otra marca…</option>
                </select>
                {isCustomMake ? (
                  <input
                    aria-label="Marca personalizada"
                    className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
                    onChange={(event) => updateRow(row.id, { make: event.target.value })}
                    placeholder="Marca"
                    value={row.make}
                  />
                ) : null}
              </div>
              <input
                aria-label="Modelo de vehículo"
                className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
                onChange={(event) => updateRow(row.id, { model: event.target.value })}
                placeholder="Modelo (ej. Corolla)"
                value={row.model}
              />
              <input
                aria-label="Año desde"
                className={`h-10 w-full rounded-md border bg-card px-2 text-sm ${invalidYears ? "border-red-400" : "border-border"}`}
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => updateRow(row.id, { yearFrom: event.target.value.replace(/\D/g, "") })}
                placeholder="Desde"
                value={row.yearFrom}
              />
              <input
                aria-label="Año hasta"
                className={`h-10 w-full rounded-md border bg-card px-2 text-sm ${invalidYears ? "border-red-400" : "border-border"}`}
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => updateRow(row.id, { yearTo: event.target.value.replace(/\D/g, "") })}
                placeholder="Hasta"
                value={row.yearTo}
              />
              <button
                aria-label="Quitar compatibilidad"
                className="inline-flex h-10 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-red-300 hover:text-red-500"
                onClick={() => removeRow(row.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {invalidYears ? (
                <p className="text-xs font-normal text-red-500 sm:col-span-5">
                  El año inicial no puede ser mayor que el final.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-semibold transition hover:bg-background"
        onClick={addRow}
        type="button"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar vehículo
      </button>
      <p className="mt-1 text-xs font-normal text-muted-foreground">
        Solo se guardan filas completas (marca, modelo y rango de años).
      </p>
    </div>
  );
}

function EditorHeader({ modeLabel, onToggle }: { modeLabel: string; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>Compatibilidad</span>
      <button
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
        onClick={onToggle}
        type="button"
      >
        {modeLabel}
      </button>
    </div>
  );
}

function emptyRow(id: number): CompatibilityRow {
  return { id, make: "", model: "", yearFrom: "", yearTo: "", custom: false };
}

function rowsFromDefaults(
  defaults: CompatibilityEditorProps["defaultCompatibilities"],
): CompatibilityRow[] {
  return defaults.map((compatibility, index) => ({
    id: index,
    make: compatibility.make,
    model: compatibility.model,
    yearFrom: String(compatibility.yearFrom),
    yearTo: String(compatibility.yearTo),
    custom: false,
  }));
}

function serializeRows(rows: CompatibilityRow[]) {
  return rows
    .filter((row) => row.make && row.model && /^\d{4}$/.test(row.yearFrom) && /^\d{4}$/.test(row.yearTo))
    .map((row) => `${row.make} ${row.model} ${row.yearFrom}-${row.yearTo}`)
    .join("\n");
}

function parseTextToRows(
  value: string,
  nextId: number,
  setNextId: (updater: (current: number) => number) => void,
): CompatibilityRow[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.map((line, index) => {
    const match = line.match(/^(.+?)\s+(\d{4})\s*-\s*(\d{4})$/);
    const split = splitMakeAndModel(match?.[1] ?? line);

    return {
      id: nextId + index,
      make: split?.make ?? "",
      model: split?.model ?? "",
      yearFrom: match?.[2] ?? "",
      yearTo: match?.[3] ?? "",
      custom: false,
    };
  });

  setNextId((current) => current + lines.length + 1);
  return rows.length > 0 ? rows : [emptyRow(nextId)];
}
