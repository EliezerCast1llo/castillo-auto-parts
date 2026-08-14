"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Carrusel horizontal con flechas.
 *
 * El contenido va en un track con scroll nativo —así funciona con gesto táctil
 * y con teclado sin JavaScript— y las flechas solo lo desplazan. Se ocultan
 * cuando no hay nada que pasar en esa dirección, para no ofrecer un control
 * muerto.
 */
export function ScrollCarousel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    // 2px de margen: los navegadores redondean scrollLeft y el extremo
    // derecho nunca cuadra exacto con scrollWidth - clientWidth.
    setCanScrollLeft(track.scrollLeft > 2);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    syncArrows();
    const observer = new ResizeObserver(syncArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [syncArrows]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    // Página completa: en desktop las tarjetas llenan el ancho exacto del
    // track, así que avanzar una pantalla las deja alineadas en vez de dejar
    // media tarjeta cortada en el borde.
    track.scrollBy({ behavior: "smooth", left: direction * track.clientWidth });
  };

  return (
    <div className="relative">
      <div
        aria-label={label}
        className="ca-no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        onScroll={syncArrows}
        ref={trackRef}
        role="group"
        tabIndex={0}
      >
        {children}
      </div>

      {canScrollLeft ? (
        <CarouselArrow direction="left" onClick={() => scrollByPage(-1)} />
      ) : null}
      {canScrollRight ? (
        <CarouselArrow direction="right" onClick={() => scrollByPage(1)} />
      ) : null}
    </div>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      aria-label={direction === "left" ? "Anterior" : "Siguiente"}
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-ca-control border border-ca-border bg-white text-ca-navy-950 shadow-ca-overlay transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white sm:inline-flex ${
        direction === "left" ? "-left-3" : "-right-3"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}
