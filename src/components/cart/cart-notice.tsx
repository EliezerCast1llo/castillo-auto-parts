"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type NoticeVariant = "success" | "error" | "info" | "warning";

const variantStyles: Record<NoticeVariant, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  success: {
    bg: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-50 border border-red-200",
    text: "text-red-600",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-ca-navy-950/5 border border-ca-navy-950/10",
    text: "text-ca-navy-950",
    icon: Info,
  },
};

function getVariant(status: string): NoticeVariant {
  if (
    [
      "stock_alert_db_unavailable",
      "stock_alert_invalid",
      "stock_alert_not_found",
      "unavailable",
      "invalid",
    ].includes(status)
  )
    return "error";

  if (["quantity_adjusted", "stock_issue", "stock_alert_rate_limited"].includes(status))
    return "warning";

  if (["stock_alert_created", "empty_cart"].includes(status)) return "info";

  return "success"; // added, removed, updated, etc.
}

const MESSAGES: Record<string, string> = {
  added: "Producto agregado al carrito.",
  empty_cart: "Agrega productos antes de continuar.",
  invalid: "No pudimos procesar esa acción. Intenta de nuevo.",
  quantity_adjusted: "Ajustamos la cantidad al stock disponible.",
  removed: "Producto eliminado del carrito.",
  stock_alert_created: "Listo. Te avisamos cuando haya disponibilidad.",
  stock_alert_db_unavailable: "No pudimos guardar el aviso. Inténtalo más tarde.",
  stock_alert_invalid: "Ingresa un email o teléfono válido.",
  stock_alert_not_found: "No encontramos ese producto.",
  stock_alert_rate_limited: "Demasiados intentos. Intenta en unos minutos.",
  stock_issue: "Revisa disponibilidad antes de continuar.",
  unavailable: "Este producto ya no está disponible.",
  updated: "Carrito actualizado.",
};

const AUTO_DISMISS_MS = 4000;

type CartNoticeProps = {
  status: string;
};

export function CartNotice({ status }: CartNoticeProps) {
  const message = MESSAGES[status];
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!message) return;

    const dismissTimer = setTimeout(() => {
      setExiting(true);
    }, AUTO_DISMISS_MS);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      // Limpiar ?estado= de la URL sin recargar
      // Solo limpia `?estado=` de la URL actual; el pathname ya es el que
      // corresponde al idioma, asi que se reusa tal cual.
      const url = new URL(window.location.href);
      url.searchParams.delete("estado");
      window.history.replaceState(null, "", url.pathname + url.search);
    }, AUTO_DISMISS_MS + 350);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(removeTimer);
    };
  }, [message, router]);

  if (!message || !visible) return null;

  const variant = getVariant(status);
  const { bg, text, icon: Icon } = variantStyles[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${bg} ${text} ${
        exiting ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{message}</span>
      <button
        aria-label="Cerrar aviso"
        className="ml-1 rounded-md p-1 opacity-50 transition hover:opacity-100"
        onClick={() => setExiting(true)}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
