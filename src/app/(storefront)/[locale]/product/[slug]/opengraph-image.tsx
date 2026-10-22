import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getCatalogProductBySlug } from "@/data/products";
import { formatCurrency } from "@/lib/money";
import { SITE_NAME } from "@/lib/site";

/** Tamaño de la imagen: lo usan tanto `generateImageMetadata` como el render. */
const size = { width: 1200, height: 630 };

/**
 * El `alt` depende del idioma, así que sale por `generateImageMetadata` y no
 * como `export const`: una constante de módulo no puede leer el segmento de
 * ruta, y esta imagen es lo que se ve al compartir la ficha.
 */
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Product" });

  return [
    {
      alt: t("ogAlt", { siteName: SITE_NAME }),
      contentType: "image/png",
      id: "product",
      size,
    },
  ];
}

/**
 * OG image por producto: foto + nombre + precio + marca.
 * Clave para compartir por WhatsApp/Facebook en el mercado salvadoreño.
 */
export default async function ProductOpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  // Con idioma: sin esto el nombre del producto salía en español dentro de la
  // imagen que se comparte desde `/en`.
  const locale = await resolveAndPublishRouteLocale(params);
  const product = await getCatalogProductBySlug(slug, locale);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#061933",
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #061933 0%, #0b3268 100%)",
          color: "#ffffff",
        }}
      >
        {/* Panel de información */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 24px 72px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f2b72a",
            }}
          >
            {`${product.brand} · ${product.category}`}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 26,
              color: "#d8e0ea",
            }}
          >
            {`SKU ${product.sku}`}
          </div>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "14px 32px",
                borderRadius: 20,
                background: "#d9a21b",
                color: "#061933",
                fontSize: 52,
                fontWeight: 800,
              }}
            >
              {formatCurrency(product.priceCents)}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#d8e0ea" }}>IVA incluido</div>
          </div>
          <div
            style={{
              marginTop: 48,
              fontSize: 28,
              fontWeight: 700,
              color: "#f2b72a",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* Foto del producto */}
        {product.primaryImageUrl ? (
          <div
            style={{
              width: 460,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 48,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 28,
                background: "#ffffff",
                padding: 24,
              }}
            >
              <img
                src={product.primaryImageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
