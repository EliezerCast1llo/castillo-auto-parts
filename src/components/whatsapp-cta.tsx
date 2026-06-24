import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { DEFAULT_SUPPORT_MESSAGE } from "@/lib/contact";

type WhatsAppCtaVariant = "button" | "floating" | "inline" | "subtle";

type WhatsAppCtaProps = {
  className?: string;
  label?: string;
  message?: string;
  phone?: string;
  variant?: WhatsAppCtaVariant;
};

export function WhatsAppCTA({
  className = "",
  label = "Consultar por WhatsApp",
  message = DEFAULT_SUPPORT_MESSAGE,
  phone,
  variant = "button",
}: WhatsAppCtaProps) {
  const href = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "/ayuda";
  const isExternal = href.startsWith("https://");
  const ariaLabel = phone ? label : "Ir a ayuda y contacto";

  const baseClass = getVariantClassName(variant);

  if (isExternal) {
    return (
      <a
        aria-label={ariaLabel}
        className={`${baseClass} ${className}`}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MessageCircle className={getIconClassName(variant)} strokeWidth={2} />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Link aria-label={ariaLabel} className={`${baseClass} ${className}`} href={href}>
      <MessageCircle className={getIconClassName(variant)} strokeWidth={2} />
      <span>{variant === "inline" ? "Te ayudamos a encontrarlo" : label}</span>
    </Link>
  );
}

function getVariantClassName(variant: WhatsAppCtaVariant) {
  if (variant === "floating") {
    return "fixed bottom-5 right-5 z-40 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#128C4A] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(18,140,74,0.32)] transition hover:-translate-y-0.5 hover:bg-[#0F7B40]";
  }

  if (variant === "inline") {
    return "inline-flex items-center gap-1.5 text-sm font-black text-ca-blue-700 transition hover:text-ca-navy-950 hover:underline";
  }

  if (variant === "subtle") {
    return "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white";
  }

  return "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#128C4A] px-5 text-sm font-black text-white shadow-[0_8px_18px_rgba(18,140,74,0.22)] transition hover:bg-[#0F7B40] hover:shadow-[0_10px_22px_rgba(18,140,74,0.28)]";
}

function getIconClassName(variant: WhatsAppCtaVariant) {
  if (variant === "inline") return "h-4 w-4";
  if (variant === "floating") return "h-5 w-5";
  return "h-4 w-4";
}
