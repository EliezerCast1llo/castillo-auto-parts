"use client";

/**
 * SearchAutocomplete — buscador con sugerencias en tiempo real.
 *
 * Comportamiento:
 * - Debounce de 300ms para no saturar /api/search con cada keystroke.
 * - Mínimo 2 caracteres para disparar la búsqueda.
 * - Máximo 6 sugerencias en el dropdown.
 * - Teclado: ArrowUp/Down navega la lista, Enter selecciona o envía form,
 *   Escape cierra el dropdown.
 * - Clic fuera cierra el dropdown.
 * - El form sigue funcionando sin JS (fallback a /catalog?q=).
 * - Al seleccionar una sugerencia navega directamente al producto.
 */

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResponse, SearchResult } from "@/app/api/search/route";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Cancelar request anterior si sigue en vuelo
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current.signal },
        );

        if (!response.ok) throw new Error("Search failed");

        const data: SearchResponse = await response.json();
        setResults(data.results);
        setIsOpen(data.results.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    if (value.length >= MIN_QUERY_LENGTH) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setResults([]);
    setIsOpen(false);
    setIsLoading(false);
    setActiveIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      setIsOpen(false);
      setIsLoading(false);
      setQuery(result.name);
      router.push(`/product/${result.slug}`);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case "Enter":
          if (activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault();
            handleSelect(results[activeIndex]);
          }
          // Si activeIndex === -1, el form submit normal lleva a /catalog?q=
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, activeIndex, handleSelect],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      // Si hay un item activo en el dropdown, navegar al producto
      if (activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
        return;
      }

      // Si no, el form navega normalmente a /catalog?q=query
      setIsOpen(false);
    },
    [activeIndex, results, handleSelect],
  );

  return (
    <form
      action="/catalog"
      className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_160px]"
      onSubmit={handleSubmit}
    >
      <div className="relative">
        <label className="flex min-h-12 items-center gap-3 rounded-md bg-card px-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            aria-autocomplete="list"
            aria-controls={isOpen ? "search-dropdown" : undefined}
            aria-expanded={isOpen}
            aria-label="Buscar repuestos"
            autoComplete="off"
            className="w-full bg-transparent text-sm outline-none"
            name="q"
            placeholder="Busca por repuesto, SKU, número de parte o vehículo"
            role="combobox"
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {isLoading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : null}
        </label>

        {isOpen && results.length > 0 ? (
          <div
            ref={dropdownRef}
            id="search-dropdown"
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-card shadow-lg"
          >
            {results.map((result, index) => (
              <button
                key={result.slug}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-background ${
                  index === activeIndex ? "bg-background" : ""
                }`}
                onMouseDown={(e) => {
                  // mousedown en lugar de onClick para ejecutar antes del blur
                  e.preventDefault();
                  handleSelect(result);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{result.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {result.category} · SKU {result.sku}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-primary">{result.formattedPrice}</p>
                  <StockDot status={result.stockStatus} />
                </div>
              </button>
            ))}

            <div className="border-t border-border px-4 py-2">
              <button
                type="submit"
                className="w-full text-left text-xs font-semibold text-primary hover:underline"
              >
                Ver todos los resultados para &ldquo;{query}&rdquo; →
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
      >
        <Search className="h-4 w-4" />
        Buscar
      </button>
    </form>
  );
}

function StockDot({ status }: { status: string }) {
  if (status === "Disponible") {
    return <span className="mt-0.5 block text-xs font-semibold text-success">{status}</span>;
  }
  if (status === "Últimas unidades") {
    return <span className="mt-0.5 block text-xs font-semibold text-warning">{status}</span>;
  }
  return <span className="mt-0.5 block text-xs font-semibold text-danger">{status}</span>;
}
