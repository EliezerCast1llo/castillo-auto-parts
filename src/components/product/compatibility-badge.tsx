import { AlertTriangle, CheckCircle2 } from "lucide-react";

type CompatibilityBadgeProps = {
  isCompatible: boolean;
  vehicleLabel?: string;
};

export function CompatibilityBadge({ isCompatible, vehicleLabel }: CompatibilityBadgeProps) {
  if (!vehicleLabel) return null;

  const Icon = isCompatible ? CheckCircle2 : AlertTriangle;
  const label = isCompatible
    ? `Compatible con tu ${vehicleLabel}`
    : "Compatibilidad no confirmada";
  const className = isCompatible
    ? "border-success/15 bg-success/10 text-success"
    : "border-warning/20 bg-warning/10 text-warning";

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="line-clamp-1">{label}</span>
    </span>
  );
}
