import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image genérica del sitio (home y páginas sin imagen propia).
 * Colores de marca: navy #061933 / gold #d9a21b.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #061933 0%, #0b3268 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#f2b72a",
          }}
        >
          Repuestos automotrices · El Salvador
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 900,
            fontSize: 32,
            lineHeight: 1.4,
            color: "#d8e0ea",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
        <div
          style={{
            marginTop: 48,
            width: 220,
            height: 10,
            borderRadius: 999,
            background: "#d9a21b",
          }}
        />
      </div>
    ),
    size,
  );
}
