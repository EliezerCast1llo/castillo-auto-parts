"use client";

/**
 * ProductImageManager — gestor de imágenes de producto en el admin.
 *
 * Permite subir nuevas imágenes y eliminar las existentes.
 * Se comunica con los Route Handlers:
 *   POST   /api/admin/upload-image
 *   DELETE /api/admin/delete-image
 *
 * Restricciones:
 *   - Solo disponible en la pantalla de edición (requiere productId existente).
 *   - JPEG, PNG y WebP. Máximo 5 MB por archivo.
 *   - La primera imagen subida se marca automáticamente como primaria.
 *
 * Estado:
 *   - `images` se inicializa desde las imágenes ya guardadas en DB (prop `initialImages`).
 *   - Al subir, se agrega optimistamente y luego se confirma con la respuesta del servidor.
 *   - Al eliminar, se espera confirmación antes de quitar de la lista.
 */

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";

export type ProductImageData = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductImageManagerProps = {
  productId: string;
  initialImages: ProductImageData[];
};

type UploadState = "idle" | "uploading" | "error";

export function ProductImageManager({ productId, initialImages }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImageData[]>(initialImages);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!event.target.files) return;
      // Reset input para permitir subir el mismo archivo de nuevo
      event.target.value = "";

      if (!file) return;

      setUploadState("uploading");
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      formData.append("alt", file.name.replace(/\.[^.]+$/, ""));
      // Primera imagen sube como primaria si no hay ninguna
      if (images.length === 0) {
        formData.append("isPrimary", "true");
      }

      try {
        const response = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as
          | { imageId: string; url: string; isPrimary: boolean }
          | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Error al subir la imagen");
        }

        setImages((prev) => [
          ...prev,
          {
            id: data.imageId,
            url: data.url,
            alt: file.name,
            isPrimary: data.isPrimary,
            sortOrder: prev.length,
          },
        ]);
        setUploadState("idle");
      } catch (error) {
        setUploadState("error");
        setUploadError(error instanceof Error ? error.message : "Error desconocido");
      }
    },
    [productId, images.length],
  );

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(async (imageId: string) => {
    setDeletingId(imageId);

    try {
      const response = await fetch("/api/admin/delete-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Error al eliminar la imagen");
      }

      setImages((prev) => {
        const remaining = prev.filter((img) => img.id !== imageId);
        // Si se eliminó la primaria, promover la primera de la lista
        const deletedWasPrimary = prev.find((img) => img.id === imageId)?.isPrimary;
        if (deletedWasPrimary && remaining.length > 0) {
          return remaining.map((img, index) => ({
            ...img,
            isPrimary: index === 0,
          }));
        }
        return remaining;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo eliminar la imagen");
    } finally {
      setDeletingId(null);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">Imágenes</h2>
        <span className="text-xs text-muted-foreground">JPEG, PNG o WebP · máx 5 MB</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Imágenes existentes */}
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-background"
          >
            <div className="relative aspect-square w-full">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </div>

            {/* Badge de imagen primaria */}
            {image.isPrimary ? (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                <Star className="h-3 w-3 fill-current" />
                Principal
              </span>
            ) : null}

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
              aria-label="Eliminar imagen"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
            >
              {deletingId === image.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>

            <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{image.alt}</p>
          </div>
        ))}

        {/* Botón para subir nueva imagen */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === "uploading"}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {uploadState === "uploading" ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-semibold">Subiendo…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-semibold">Agregar imagen</span>
            </>
          )}
        </button>
      </div>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error de upload */}
      {uploadState === "error" && uploadError ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          <Upload className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      ) : null}

      {/* Estado vacío */}
      {images.length === 0 && uploadState !== "uploading" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Sin imágenes. La primera que subas se marcará como imagen principal del producto.
        </p>
      ) : null}
    </section>
  );
}
