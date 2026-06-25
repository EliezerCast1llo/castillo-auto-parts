import { Check, Clock3, RotateCcw, XCircle } from "lucide-react";
import type { OrderTrackingStep } from "@/lib/order-tracking";

type OrderStatusStepperProps = {
  isCancelled?: boolean;
  isRefunded?: boolean;
  label?: string;
  steps: OrderTrackingStep[];
};

export function OrderStatusStepper({
  isCancelled = false,
  isRefunded = false,
  label,
  steps,
}: OrderStatusStepperProps) {
  if (isCancelled || isRefunded) {
    const Icon = isCancelled ? XCircle : RotateCcw;
    const title = label ?? (isCancelled ? "Cancelado" : "Reembolsado");

    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
          isCancelled
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-100 text-slate-700"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(6,25,51,0.06)]">
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
                    step.status === "completed" ? "bg-ca-navy-950" : "bg-ca-border"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] shadow-[0_4px_10px_rgba(6,25,51,0.06)] ${style.circle}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              <span className={`mt-1.5 max-w-[96px] text-center text-[11px] font-black leading-tight ${style.label}`}>
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
      circle: "border-ca-navy-950 bg-ca-navy-950 text-white",
      label: "text-ca-navy-950",
    };
  }

  if (status === "current") {
    return {
      circle: "border-ca-blue-700 bg-ca-blue-700 text-white ring-4 ring-ca-blue-700/12",
      label: "text-ca-blue-700",
    };
  }

  return {
    circle: "border-ca-border bg-white text-ca-text-secondary",
    label: "text-ca-text-secondary",
  };
}
