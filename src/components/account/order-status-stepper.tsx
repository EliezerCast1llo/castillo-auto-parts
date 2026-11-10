import { Check, Clock3, RotateCcw, XCircle } from "lucide-react";
import type { OrderTrackingStep } from "@/lib/order-tracking";

/**
 * Un paso con su texto ya resuelto.
 *
 * La etiqueta viaja **dentro** del paso y no en un array paralelo: dos arrays
 * que deben coincidir en orden y longitud son una convención que hay que
 * recordar, y este componente existe justamente porque el módulo de
 * seguimiento dejó de mezclar identificador con texto. Armarlo así lo vuelve
 * imposible de desalinear.
 */
export type LabeledTrackingStep = OrderTrackingStep & { label: string };

type OrderStatusStepperProps = {
  isCancelled?: boolean;
  isRefunded?: boolean;
  /** Texto ya traducido del estado. */
  label: string;
  steps: LabeledTrackingStep[];
};

export function OrderStatusStepper({
  isCancelled = false,
  isRefunded = false,
  label,
  steps,
}: OrderStatusStepperProps) {
  if (isCancelled || isRefunded) {
    const Icon = isCancelled ? XCircle : RotateCcw;
    const title = label;

    return (
      <div
        className={`flex items-center gap-3 rounded-ca-control border px-4 py-3 text-sm font-bold ${
 isCancelled
 ? "border-danger/20 bg-danger/10 text-danger"
 : "border-ca-border bg-ca-bg text-ca-text-secondary"
 }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ca-control bg-ca-surface">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[430px] items-start px-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const style = getStepStyle(step.status);
          const Icon = step.status === "completed" ? Check : Clock3;

          return (
            <li className="relative flex flex-1 flex-col items-center" key={step.key}>
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-3.5 h-px w-full ${
 step.status ==="completed" ? "bg-ca-navy" : "bg-ca-border"
 }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-ca-control border text-xs ${style.circle}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              <span className={`mt-1.5 max-w-[96px] text-center text-xs font-bold leading-tight ${style.label}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getStepStyle(status: OrderTrackingStep["status"]) {
  if (status === "completed") {
    return {
      circle: "border-ca-navy bg-ca-navy text-white",
      label: "text-ca-navy",
    };
  }

  if (status === "current") {
    return {
      circle: "border-ca-navy-hover bg-ca-navy-hover text-white ring-4 ring-ca-navy-hover/12",
      label: "text-ca-navy-hover",
    };
  }

  return {
    circle: "border-ca-border bg-ca-surface text-ca-text-secondary",
    label: "text-ca-text-secondary",
  };
}
