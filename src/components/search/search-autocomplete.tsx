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

import { buttonVariants } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResponse, SearchResult } from "@/app/api/search/route";
import { useLocale, useTranslations } from "next-intl";
import type { StockStatus } from "@/lib/stock-status";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type SearchAutocompleteProps = {
  /** "default" → buscador del header. "hero" → buscador principal de inicio. */
  variant?: "default" | "hero";
};

export function SearchAutocomplete({ variant = "default" }: SearchAutocompleteProps = {}) {
  const t = useTranslations("Nav");
  const locale = useLocale();
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
          `/api/search?q=${encodeURIComponent(query)}&locale=${locale}`,
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
  }, [locale, query]);

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
      router.push({ pathname: "/product/[slug]", params: { slug: result.slug } });
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

  const isHero = variant === "hero";

  if (isHero) {
    return (
      <form
        action="/catalog"
        className="relative z-40 flex items-center gap-2 rounded-ca-surface border border-ca-border bg-ca-surface p-2 text-ca-text"
        onSubmit={handleSubmit}
      >
        <div className="relative min-w-0 flex-1">
          <label className="flex min-h-12 items-center gap-3 rounded-ca-control bg-ca-bg px-4 focus-within:outline-2 focus-within:outline-ca-navy-hover">
            <Search className="h-4 w-4 shrink-0 text-ca-text-secondary" strokeWidth={1.8} />
            <span className="sr-only">{t("searchAriaLabel")}</span>
            <input
              ref={inputRef}
              aria-autocomplete="list"
              aria-controls={isOpen ? "search-dropdown" : undefined}
              aria-expanded={isOpen}
              aria-label={t("searchAriaLabel")}
              autoComplete="off"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-ca-text-secondary"
              name="q"
              placeholder={t("searchPlaceholderLong")}
              role="combobox"
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => { if (results.length > 0) setIsOpen(true); }}
              onKeyDown={handleKeyDown}
            />
            {isLoading ? (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-ca-navy border-t-transparent" />
            ) : null}
          </label>

          {isOpen && results.length > 0 ? (
            <div
              ref={dropdownRef}
              id="search-dropdown"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-ca-surface border border-ca-border bg-ca-surface shadow-ca-overlay"
            >
              <SearchDropdownItems
                results={results}
                activeIndex={activeIndex}
                query={query}
                onSelect={handleSelect}
                onHover={setActiveIndex}
              />
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          className={buttonVariants({ size: "lg", className: "shrink-0" })}
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          <span>{t("search")}</span>
        </button>
      </form>
    );
  }

  /* ── Variante default (header) ─────────────────────────────── */
  return (
    <form
      action="/catalog"
      className="relative flex h-10 items-center rounded-ca-control border border-ca-border bg-ca-bg pl-4 pr-1 transition focus-within:border-ca-navy-hover focus-within:bg-ca-surface focus-within:outline-2 focus-within:outline-ca-navy-hover"
      onSubmit={handleSubmit}
    >
      <Search className="h-4 w-4 shrink-0 text-ca-text-secondary" strokeWidth={1.8} />
      <span className="sr-only">{t("searchAriaLabel")}</span>
      <input
        ref={inputRef}
        aria-autocomplete="list"
        aria-controls={isOpen ? "search-dropdown" : undefined}
        aria-expanded={isOpen}
        aria-label={t("searchAriaLabel")}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-ca-text-secondary"
        name="q"
        placeholder={t("searchPlaceholderShort")}
        role="combobox"
        type="search"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {isLoading ? (
        <span className="mr-2 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-ca-navy border-t-transparent" />
      ) : null}
      <button
        type="submit"
        aria-label={t("search")}
        className={buttonVariants({ className: "w-8 shrink-0 px-0" })}
      >
        <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>

      {isOpen && results.length > 0 ? (
        <div
          ref={dropdownRef}
          id="search-dropdown"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-ca-surface border border-ca-border bg-ca-surface shadow-ca-overlay"
        >
          <SearchDropdownItems
            results={results}
            activeIndex={activeIndex}
            query={query}
            onSelect={handleSelect}
            onHover={setActiveIndex}
          />
        </div>
      ) : null}
    </form>
  );
}

function SearchDropdownItems({
  results,
  activeIndex,
  query,
  onSelect,
  onHover,
}: {
  results: SearchResult[];
  activeIndex: number;
  query: string;
  onSelect: (r: SearchResult) => void;
  onHover: (i: number) => void;
}) {
  const t = useTranslations("Nav");
  return (
    <>
      {results.map((result, index) => (
        <button
          key={result.slug}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-ca-bg ${
 index === activeIndex ? "bg-ca-bg" : ""
 }`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(result); }}
          onMouseEnter={() => onHover(index)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ca-navy">{result.name}</p>
            <p className="mt-0.5 text-xs text-ca-text-secondary">
              {result.category} · SKU {result.sku}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-bold text-ca-navy">{result.formattedPrice}</p>
            <StockDot status={result.stockStatus} />
          </div>
        </button>
      ))}
      <div className="border-t border-ca-border px-4 py-2.5">
        <button
          type="submit"
          className="w-full text-left text-xs font-bold text-ca-navy-hover hover:underline"
        >
          {t("seeAllResults", { query })}
        </button>
      </div>
    </>
  );
}

function StockDot({ status }: { status: StockStatus }) {
  const t = useTranslations("Catalog");
  const label = t(`stockStatus.${status}`);

  if (status === "IN_STOCK") {
    return <span className="mt-0.5 block text-xs font-bold text-ca-success">{label}</span>;
  }
  if (status === "LOW_STOCK") {
    return <span className="mt-0.5 block text-xs font-bold text-warning">{label}</span>;
  }
  return <span className="mt-0.5 block text-xs font-bold text-danger">{label}</span>;
}
