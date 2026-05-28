/**
 * POST /api/admin/upload-image
 *
 * Sube una imagen de producto a Cloudflare R2 y registra el record en DB.
 *
 * Request: multipart/form-data
 *   file      — archivo de imagen (JPEG, PNG o WebP, máx 5 MB)
 *   productId — ID del producto al que pertenece la imagen
 *   alt       — texto alternativo (opcional, default: nombre del producto)
 *   isPrimary — "true" si es la imagen principal (opcional)
 *
 * Response 200:
 *   { imageId: string, url: string, isPrimary: boolean }
 *
 * Response 400: validación fallida
 * Response 401: no autenticado
 * Response 404: producto no encontrado
 * Response 500: error de upload o DB
 */

import { type NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  buildR2Key,
  isAllowedImageMimeType,
  MAX_IMAGE_SIZE_BYTES,
  uploadToR2,
} from "@/lib/r2";

export async function POST(request: NextRequest) {
  // 1. Autenticación admin
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Leer multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  const productId = formData.get("productId");
  const altRaw = formData.get("alt");
  const isPrimaryRaw = formData.get("isPrimary");

  // 3. Validar campos
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' requerido" }, { status: 400 });
  }

  if (typeof productId !== "string" || !productId.trim()) {
    return NextResponse.json({ error: "Campo 'productId' requerido" }, { status: 400 });
  }

  if (!isAllowedImageMimeType(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPEG, PNG o WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar 5 MB." },
      { status: 400 },
    );
  }

  // 4. Verificar que el producto existe
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const alt = typeof altRaw === "string" && altRaw.trim() ? altRaw.trim() : product.name;
  const isPrimary = isPrimaryRaw === "true";

  // 5. Subir a R2
  const key = buildR2Key(productId, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadResult: Awaited<ReturnType<typeof uploadToR2>>;
  try {
    uploadResult = await uploadToR2(key, buffer, file.type);
  } catch (error) {
    console.error("[upload-image] R2 upload failed:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }

  // 6. Si es primaria, desmarcar las demás del mismo producto
  try {
    const imageRecord = await db.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      // Calcular sortOrder: siguiente al máximo existente
      const maxSort = await tx.productImage.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

      return tx.productImage.create({
        data: {
          productId,
          url: uploadResult.publicUrl,
          alt,
          sortOrder,
          isPrimary: isPrimary || sortOrder === 0, // primera imagen siempre es primaria
        },
        select: { id: true, url: true, isPrimary: true },
      });
    });

    return NextResponse.json({
      imageId: imageRecord.id,
      url: imageRecord.url,
      isPrimary: imageRecord.isPrimary,
    });
  } catch (error) {
    console.error("[upload-image] DB error:", error);
    // Intentar limpiar el objeto de R2 si la DB falla
    try {
      const { deleteFromR2 } = await import("@/lib/r2");
      await deleteFromR2(key);
    } catch {
      console.error("[upload-image] Failed to clean up R2 object after DB error");
    }

    return NextResponse.json({ error: "Error al guardar la imagen" }, { status: 500 });
  }
}
