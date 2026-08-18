/**
 * DELETE /api/admin/delete-image
 *
 * Elimina una imagen de producto de R2 y de la base de datos.
 *
 * Request: JSON body
 *   { imageId: string }
 *
 * Response 200: { ok: true }
 * Response 400: imageId faltante
 * Response 401: no autenticado
 * Response 404: imagen no encontrada
 * Response 500: error de R2 o DB
 *
 * Estrategia de consistencia:
 *   1. Eliminar de DB primero para evitar referencias huérfanas.
 *   2. Eliminar de R2 después. Si R2 falla, el objeto queda huérfano en el bucket
 *      pero no hay referencia en DB (es mejor que el caso inverso).
 *   3. Si el producto se queda sin imágenes o sin primaria, se reajusta automáticamente.
 */

import { type NextRequest, NextResponse } from "next/server";
import { getAdminUserForHandler } from "@/lib/admin-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { enforceRateLimit } from "@/lib/api-rate-limit";
import { db } from "@/lib/db";
import { createAdminImageRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";
import { getClientIp } from "@/lib/request-ip";
import { extractR2Key, deleteFromR2 } from "@/lib/r2";

let _deleteRateLimiter: AsyncRateLimiter | undefined;

export async function DELETE(request: NextRequest) {
  // 0. Rate limit por IP antes de auth: evita floods de delete pre-autenticación.
  const limiter = (_deleteRateLimiter ??= createAdminImageRateLimiter());
  const limited = await enforceRateLimit(
    limiter,
    `admin-delete:ip:${getClientIp(request.headers)}`,
    "Demasiadas solicitudes. Intenta en un momento.",
  );
  if (limited) return limited;

  // 1. Autenticación y autorización admin (solo ADMIN y MARKETING)
  const auth = await getAdminUserForHandler("ADMIN", "MARKETING");
  if ("response" in auth) return auth.response;

  // 2. Leer body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  const imageId =
    body !== null && typeof body === "object" && "imageId" in body
      ? (body as { imageId: unknown }).imageId
      : undefined;

  if (typeof imageId !== "string" || !imageId.trim()) {
    return NextResponse.json({ error: "Campo 'imageId' requerido" }, { status: 400 });
  }

  // 3. Buscar imagen en DB
  const image = await db.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, url: true, productId: true, isPrimary: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  // 4. Eliminar de DB y reasignar primaria si hace falta
  try {
    await db.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });

      // Si era la primaria, promover la siguiente imagen disponible
      if (image.isPrimary) {
        const next = await tx.productImage.findFirst({
          where: { productId: image.productId },
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        });

        if (next) {
          await tx.productImage.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
        }
      }

      await writeAdminAuditLog(tx, {
        action: "image.deleted",
        entityType: "ProductImage",
        entityId: imageId,
        entityLabel: image.productId,
        adminUserId: auth.user.id,
        adminUserEmail: auth.user.email,
      });
    });
  } catch (error) {
    console.error("[delete-image] DB error:", error);
    return NextResponse.json({ error: "Error al eliminar la imagen" }, { status: 500 });
  }

  // 5. Eliminar de R2 (después de la DB para consistencia)
  const r2Key = extractR2Key(image.url);
  if (r2Key) {
    try {
      await deleteFromR2(r2Key);
    } catch (error) {
      // Objeto queda huérfano en R2 pero no hay referencia en DB.
      // Loguear para limpieza manual futura.
      console.error("[delete-image] R2 delete failed for key:", r2Key, error);
    }
  }

  return NextResponse.json({ ok: true });
}
