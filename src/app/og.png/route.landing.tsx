import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * La tarjeta de vista previa.
 *
 * WhatsApp es el único canal al que empuja esta página, y un enlace pegado ahí
 * sin tarjeta se ve como un enlace cualquiera. Esta suele ser lo **primero**
 * que alguien ve de la marca, así que lleva la señal entera y no un resumen:
 * campo verde, flecha, distancia en tiempo y placa de salida biselada, que son
 * las cuatro cosas por las que esta página se reconoce.
 *
 * No hace falta ninguna foto y no afirma nada que no sea cierto.
 */
export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * La ruta se arma a mano y no con `require.resolve`.
 *
 * Con una plantilla adentro, el empaquetador la trata como un import dinámico
 * e intenta empaquetar **todos** los `.woff` del paquete, que no sabe leer.
 * Acá el archivo se abre en disco, que es literalmente lo que hace falta, y
 * ocurre al compilar porque la imagen es estática.
 */
function fontPath(weight: 600 | 800) {
  return path.join(
    process.cwd(),
    "node_modules/@fontsource/overpass/files",
    `overpass-latin-${weight}-normal.woff`,
  );
}

/** La misma flecha que dibuja la página, al mismo grosor de trazo. */
function SignArrow({ width, color }: { width: number; color: string }) {
  return (
    <svg fill="none" height={width / 2} viewBox="0 0 48 24" width={width}>
      <path d="M2 12h38M30 2l12 10-12 10" stroke={color} strokeWidth="3" />
    </svg>
  );
}

function DestinationRow({ place, when }: { place: string; when: string }) {
  return (
    <div
      style={{
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.24)",
        display: "flex",
        gap: 24,
        paddingBottom: 14,
        paddingTop: 14,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flex: 1, fontSize: 26, fontWeight: 600 }}>{place}</div>
      <SignArrow color="#c7d8cc" width={44} />
      {/* El tiempo por encima del lugar: es el argumento, no el adorno. Son
          los topes de la escala de la página, que acá es un marco fijo. */}
      <div style={{ display: "flex", fontSize: 46, fontWeight: 800, letterSpacing: "0.03em" }}>
        {when}
      </div>
    </div>
  );
}

export async function GET() {
  const [semibold, bold] = await Promise.all([
    readFile(fontPath(600)),
    readFile(fontPath(800)),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b6b3a",
          border: "6px solid #f2f5f2",
          color: "#f2f5f2",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Overpass",
          height: "100%",
          justifyContent: "space-between",
          padding: 56,
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", fontSize: 30, fontWeight: 800, gap: 18 }}>
          <div
            style={{
              alignItems: "center",
              background: "#f2f5f2",
              // El recorte del escudo de ruta.
              clipPath: "polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)",
              color: "#085129",
              display: "flex",
              fontSize: 25,
              fontWeight: 800,
              height: 56,
              justifyContent: "center",
              width: 68,
            }}
          >
            CA
          </div>
          Castillo Autoparts
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              maxWidth: 820,
            }}
          >
            Tu próximo repuesto empieza aquí.
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <DestinationRow place="Retiro en bodega" when="HOY" />
            <DestinationRow place="Entrega en San Salvador" when="HOY O MAÑANA" />
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            alignSelf: "flex-end",
            background: "#f2b705",
            // Sin bisel, a diferencia de la página. El renderizador de esta
            // imagen no aplica `clip-path` sobre un contenedor con hijos: pinta
            // el fondo solo detrás del primero y la placa queda como un
            // recuadro suelto. Se prefiere una placa entera y honesta antes que
            // una recortada a medias; la silueta vive en la página, y acá
            // quedan las otras tres marcas del mundo —campo verde, flecha y
            // distancia en tiempo— más la leyenda de salida.
            color: "#16181a",
            display: "flex",
            gap: 18,
            paddingBottom: 16,
            paddingLeft: 28,
            paddingRight: 40,
            paddingTop: 16,
            // Ancho explícito: con ancho automático este renderizador pinta el
            // fondo solo detrás del primer hijo, y la placa queda como un
            // recuadro suelto alrededor de la leyenda.
            width: 620,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>
            Escríbenos por WhatsApp
          </div>
          <SignArrow color="#16181a" width={44} />
        </div>
      </div>
    ),
    {
      fonts: [
        { data: semibold, name: "Overpass", style: "normal", weight: 600 },
        { data: bold, name: "Overpass", style: "normal", weight: 800 },
      ],
      height: 630,
      width: 1200,
    },
  );
}
