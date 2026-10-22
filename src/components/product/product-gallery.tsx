"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductVisual } from "./product-visual";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  /**
   * Texto de la miniatura, ya resuelto.
   *
   * Viaja **dentro** de la imagen y no como función ni array paralelo: una
   * función no cruza la frontera servidor→cliente —el runtime lo rechaza,
   * TypeScript no— y dos arrays que deben coincidir en orden son la forma que
   * esta serie viene sacando. Lo arma quien tiene el traductor.
   */
  label: string;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  productName: string;
  productSku: string;
};

export function ProductGallery({
  images,
  productName,
  productSku,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? null;

  if (images.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-md bg-background p-4 sm:p-8">
        <ProductVisual seed={productSku} size="large" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
      {/* Columna de thumbnails */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-1">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={image.label}
            className={`relative aspect-square overflow-hidden rounded-md border-2 bg-background transition ${
              index === activeIndex
                ? "border-primary shadow-sm"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="96px"
              className="object-contain p-1"
            />
          </button>
        ))}
      </div>

      {/* Imagen principal */}
      <div className="flex min-h-[360px] items-center justify-center rounded-md bg-background p-4 sm:p-8">
        {activeImage ? (
          <div className="relative h-[300px] w-full sm:h-[360px]">
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-contain"
              priority
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
