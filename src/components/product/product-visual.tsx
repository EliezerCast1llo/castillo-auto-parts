import {
  BatteryCharging,
  CloudRain,
  Disc3,
  Filter,
  Gauge,
  Lightbulb,
  PlugZap,
  Sparkles,
  Wrench,
} from "lucide-react";

type ProductVisualProps = {
  kind?: string;
  seed: string;
  size?: "card" | "large" | "thumb";
  /** Color del icono. Por defecto gris, para que sea un hueco discreto. */
  tone?: string;
};

const sizes = {
  card: "h-28 w-36",
  large: "h-64 w-72",
  thumb: "h-14 w-[4.5rem]",
};

const iconSizes = {
  card: "h-16 w-16",
  large: "h-28 w-28",
  thumb: "h-8 w-8",
};

/**
 * Marcador de producto sin foto. Deliberadamente plano y en gris: es un hueco
 * honesto, no un adorno. La versión anterior apilaba degradado, mancha
 * borrosa, dos círculos de color y un panel interior con sombra, y ese
 * apilado era justo lo que hacía parecer maqueta a la grilla entera.
 */
export function ProductVisual({
  kind,
  seed,
  size = "card",
  tone = "text-ca-border-hover",
}: ProductVisualProps) {
  const visualType = getProductVisualType(kind ?? seed);

  return (
    <div aria-hidden="true" className={`flex ${sizes[size]} items-center justify-center ${tone}`}>
      {renderProductIcon(visualType, size)}
    </div>
  );
}

type ProductVisualType =
  | "battery"
  | "brake"
  | "electric"
  | "filter"
  | "fluid"
  | "light"
  | "shock"
  | "tool"
  | "wiper";

function getProductVisualType(value: string): ProductVisualType {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("filtro")) return "filter";
  if (normalized.includes("freno") || normalized.includes("pastilla")) return "brake";
  if (normalized.includes("bujia") || normalized.includes("electrico")) return "electric";
  if (normalized.includes("foco") || normalized.includes("bombillo") || normalized.includes("luz"))
    return "light";
  if (normalized.includes("escobilla") || normalized.includes("limpiaparabrisas")) return "wiper";
  if (normalized.includes("bateria")) return "battery";
  if (normalized.includes("amortiguador") || normalized.includes("suspension")) return "shock";
  if (normalized.includes("fluido") || normalized.includes("aceite")) return "fluid";

  const fallbackTypes: ProductVisualType[] = [
    "filter",
    "brake",
    "electric",
    "shock",
    "battery",
    "tool",
    "fluid",
    "light",
    "wiper",
  ];
  return fallbackTypes[hashSeed(value) % fallbackTypes.length];
}

function renderProductIcon(type: ProductVisualType, size: ProductVisualProps["size"]) {
  const className = iconSizes[size ?? "card"];

  if (type === "filter") return <Filter className={className} strokeWidth={1.75} />;
  if (type === "brake") return <Disc3 className={className} strokeWidth={1.75} />;
  if (type === "electric") return <PlugZap className={className} strokeWidth={1.75} />;
  if (type === "battery") return <BatteryCharging className={className} strokeWidth={1.75} />;
  if (type === "shock") return <Gauge className={className} strokeWidth={1.75} />;
  if (type === "fluid") return <Sparkles className={className} strokeWidth={1.75} />;
  if (type === "light") return <Lightbulb className={className} strokeWidth={1.75} />;
  if (type === "wiper") return <CloudRain className={className} strokeWidth={1.75} />;
  return <Wrench className={className} strokeWidth={1.75} />;
}

function hashSeed(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}
