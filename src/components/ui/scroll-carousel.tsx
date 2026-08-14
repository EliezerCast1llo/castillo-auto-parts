"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** Cada cuánto avanza solo. */
const AUTOPLAY_MS = 5000;
/** Tras tocar el carrusel, cuánto espera antes de retomar el avance solo. */
const RESUME_AFTER_INTERACTION_MS = 10000;

/**
 * Carrusel horizontal con flechas y avance automático.
 *
 * El contenido va en un track con scroll nativo —así funciona con gesto táctil
 * y con teclado sin JavaScript— y las flechas solo lo desplazan. Se ocultan
 * cuando no hay nada que pasar en esa dirección, para no ofrecer un control
 * muerto.
 *
 * El avance automático se detiene cuando estorbaría: con el puntero encima,
 * con el foco dentro, mientras el carrusel está fuera de pantalla, y durante
 * unos segundos después de que la persona lo haya movido a mano. Y no arranca
 * si el sistema pide movimiento reducido.
 */
export function ScrollCarousel({
  autoPlay = false,
  children,
  label,
}: {
  autoPlay?: boolean;
  children: ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const interactedUntilRef = useRef(0);
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

  // Avance automático
  useEffect(() => {
    if (!autoPlay) return;
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    observer.observe(track);

    const timer = window.setInterval(() => {
      if (!onScreen || hoveredRef.current || Date.now() < interactedUntilRef.current) return;

      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      track.scrollTo({ behavior: "smooth", left: atEnd ? 0 : track.scrollLeft + track.clientWidth });
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [autoPlay]);

  const holdAutoPlay = () => {
    interactedUntilRef.current = Date.now() + RESUME_AFTER_INTERACTION_MS;
  };

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    holdAutoPlay();
    // Página completa: en desktop las tarjetas llenan el ancho exacto del
    // track, así que avanzar una pantalla las deja alineadas en vez de dejar
    // media tarjeta cortada en el borde.
    track.scrollBy({ behavior: "smooth", left: direction * track.clientWidth });
  };

  return (
    <div
      className="relative"
      onBlurCapture={() => {
        hoveredRef.current = false;
      }}
      onFocusCapture={() => {
        hoveredRef.current = true;
      }}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <div
        aria-label={label}
        className="ca-no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
        onPointerDown={holdAutoPlay}
        onScroll={syncArrows}
        onWheel={holdAutoPlay}
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
