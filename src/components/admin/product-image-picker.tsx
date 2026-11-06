"use client";

/**
 * Imágenes elegidas antes de que el producto exista.
 *
 * `ProductImageManager` sube contra un producto ya guardado: la ruta de subida
 * exige un `productId` real porque la fila de imagen apunta a él. Al crear no
 * hay ninguno todavía, así que acá los archivos se quedan **en el navegador**
 * hasta que el guardado devuelve el id, y recién entonces se suben.
 *
 * La alternativa era subirlos antes a un área de espera, lo que obliga a una
 * tabla de pendientes, un prefijo aparte en el almacenamiento y una limpieza
 * periódica de lo que nadie llegó a guardar. Esperar en el navegador no deja
 * nada que limpiar: si se abandona el formulario, no se subió nada.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/image-upload-limits";

export type PendingImage = {
  file: File;
  /** URL local para la vista previa. Se revoca al quitarla. */
  previewUrl: string;
};

type ProductImagePickerProps = {
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
  disabled?: boolean;
};

const ACCEPTED = "image/jpeg,image/png,image/webp";

export function ProductImagePicker({ images, onChange, disabled }: ProductImagePickerProps) {
  const [error, setError] = useState<string | null>(null);

  // Las URLs de vista previa son recursos del navegador: si no se revocan al
  // desmontar, quedan retenidas hasta que se cierre la pestaña.
  useEffect(() => {
    return () => {
      for (const image of images) URL.revokeObjectURL(image.previewUrl);
    };
    // Solo al desmontar: revocar en cada cambio rompería las vistas vivas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    // Se limpia para poder volver a elegir el mismo archivo.
    event.target.value = "";
    if (picked.length === 0) return;

    const tooBig = picked.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (tooBig) {
      // Se avisa acá y no después de crear el producto: el límite lo rechaza
      // el servidor igual, pero ahí el producto ya existiría y el aviso
      // llegaría con la ficha a medio hacer.
      setError(`"${tooBig.name}" supera los 5 MB.`);
      return;
    }

    setError(null);
    onChange([
      ...images,
      ...picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  }

  function remove(index: number) {
    URL.revokeObjectURL(images[index].previewUrl);
    onChange(images.filter((_, position) => position !== index));
  }

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-bold text-primary">Imágenes</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        JPEG, PNG o WebP, hasta 5 MB cada una. Se suben cuando se crea el producto; la primera
        queda como principal.
      </p>

      {error ? (
        <p className="mt-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.previewUrl}
              className="relative overflow-hidden rounded-md border border-border bg-background"
            >
              <Image
                alt={image.file.name}
                className="h-28 w-full object-contain"
                height={112}
                src={image.previewUrl}
                unoptimized
                width={160}
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Star className="h-3 w-3" strokeWidth={2.4} />
                  Principal
                </span>
              ) : null}
              <button
                aria-label={`Quitar ${image.file.name}`}
                className="absolute right-1 top-1 rounded bg-danger p-1 text-white disabled:opacity-50"
                disabled={disabled}
                onClick={() => remove(index)}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
              <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">
                {image.file.name}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary">
        <ImagePlus className="h-4 w-4" strokeWidth={2} />
        Agregar imágenes
        <input
          accept={ACCEPTED}
          className="sr-only"
          disabled={disabled}
          multiple
          onChange={handleFiles}
          type="file"
        />
      </label>
    </section>
  );
}
