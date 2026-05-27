import { BatteryCharging, Disc3, Filter, Gauge, PlugZap, Sparkles, Wrench } from "lucide-react";

type ProductVisualProps = {
  kind?: string;
  seed: string;
  size?: "card" | "large" | "thumb";
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

export function ProductVisual({ kind, seed, size = "card" }: ProductVisualProps) {
  const visualType = getProductVisualType(kind ?? seed);

  return (
    <div
      aria-hidden="true"
      className={`relative flex ${sizes[size]} items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#eef3f8] to-[#d9e3ee] shadow-inner`}
    >
      <div className="absolute inset-x-4 bottom-3 h-5 rounded-full bg-ca-navy-950/10 blur-md" />
      <div className="absolute -right-5 -top-7 h-20 w-20 rounded-full bg-ca-blue-700/10" />
      <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-ca-gold-400/12" />
      <div className="relative flex h-[74%] w-[74%] items-center justify-center rounded-[22px] border border-white/70 bg-white/75 text-ca-navy-900 shadow-[0_14px_30px_rgba(6,25,51,0.12)]">
        {renderProductIcon(visualType, size)}
      </div>
    </div>
  );
}

type ProductVisualType = "battery" | "brake" | "electric" | "filter" | "fluid" | "shock" | "tool";

function getProductVisualType(value: string): ProductVisualType {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("filtro")) return "filter";
  if (normalized.includes("freno") || normalized.includes("pastilla")) return "brake";
  if (normalized.includes("bujia") || normalized.includes("electrico")) return "electric";
  if (normalized.includes("bateria")) return "battery";
  if (normalized.includes("amortiguador") || normalized.includes("suspension")) return "shock";
  if (normalized.includes("fluido") || normalized.includes("aceite")) return "fluid";

  const fallbackTypes: ProductVisualType[] = ["filter", "brake", "electric", "shock", "battery", "tool", "fluid"];
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
  return <Wrench className={className} strokeWidth={1.75} />;
}

function hashSeed(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}
