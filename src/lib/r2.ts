/**
 * Cliente Cloudflare R2 para almacenamiento de imágenes de producto.
 *
 * R2 es compatible con la API S3 de AWS. Usamos @aws-sdk/client-s3 con el
 * endpoint de Cloudflare en lugar del endpoint de AWS.
 *
 * Variables de entorno requeridas (.env):
 *   CLOUDFLARE_R2_ACCOUNT_ID       — ID de cuenta Cloudflare
 *   CLOUDFLARE_R2_ACCESS_KEY_ID    — Access Key del Account API Token de R2
 *   CLOUDFLARE_R2_SECRET_ACCESS_KEY — Secret Key del Account API Token de R2
 *   CLOUDFLARE_R2_BUCKET_NAME      — nombre del bucket (ej: castillo-auto-parts)
 *   CLOUDFLARE_R2_PUBLIC_URL       — URL pública del bucket (https://pub-xxx.r2.dev)
 *
 * Estructura de claves en el bucket:
 *   products/{productId}/{uuid}.{ext}
 *
 * Solo se usa en el servidor (Server Actions / Route Handlers).
 * Nunca exponer las credenciales al cliente.
 */

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type R2UploadResult = {
  key: string;
  publicUrl: string;
};

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Valida que el tipo MIME sea aceptado.
 */
export function isAllowedImageMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Tamaño máximo permitido para subir imágenes de producto.
 */
export const MAX_IMAGE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

// ---------------------------------------------------------------------------
// Cliente S3 (singleton por módulo)
// ---------------------------------------------------------------------------

function createR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 no está configurado. Agrega CLOUDFLARE_R2_ACCOUNT_ID, " +
        "CLOUDFLARE_R2_ACCESS_KEY_ID y CLOUDFLARE_R2_SECRET_ACCESS_KEY en .env.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// Lazy singleton — solo se instancia cuando se llama por primera vez.
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  _r2Client ??= createR2Client();
  return _r2Client;
}

// ---------------------------------------------------------------------------
// Helpers de bucket y URLs
// ---------------------------------------------------------------------------

function getBucketName(): string {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!bucket) throw new Error("CLOUDFLARE_R2_BUCKET_NAME no está configurado.");
  return bucket;
}

export function getR2PublicUrl(key: string): string {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrl) throw new Error("CLOUDFLARE_R2_PUBLIC_URL no está configurado.");
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/**
 * Genera una clave única para el objeto en R2.
 * Formato: products/{productId}/{timestamp}-{random}.{ext}
 */
export function buildR2Key(productId: string, mimeType: AllowedMimeType): string {
  const ext = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : mimeType.split("/")[1];
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `products/${productId}/${timestamp}-${random}.${ext}`;
}

// ---------------------------------------------------------------------------
// Operaciones principales
// ---------------------------------------------------------------------------

/**
 * Sube un archivo de imagen a R2.
 *
 * @param key    — clave de objeto generada con buildR2Key()
 * @param body   — contenido del archivo como Buffer
 * @param contentType — MIME type validado
 * @returns      — URL pública del objeto subido
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: AllowedMimeType,
): Promise<R2UploadResult> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
    // Cache-Control: imágenes de producto cambian poco, CDN puede cachear 7 días
    CacheControl: "public, max-age=604800, immutable",
  });

  await getR2Client().send(command);

  return {
    key,
    publicUrl: getR2PublicUrl(key),
  };
}

/**
 * Elimina un objeto de R2 por su clave.
 * No lanza error si el objeto no existe (idempotente).
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  await getR2Client().send(command);
}

/**
 * Extrae la clave R2 de una URL pública.
 * Ejemplo: "https://pub-xxx.r2.dev/products/abc/img.jpg" → "products/abc/img.jpg"
 * Retorna null si la URL no corresponde al bucket configurado.
 */
export function extractR2Key(publicUrl: string): string | null {
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!baseUrl) return null;

  const base = baseUrl.replace(/\/$/, "");
  if (!publicUrl.startsWith(base + "/")) return null;

  return publicUrl.slice(base.length + 1);
}
