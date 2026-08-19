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
 // Sin aria-label: el texto visible es el nombre accesible. El override
 // anterior ("Ir a ayuda y contacto") no contenia el texto visible ("Asesoria")
 // y disparaba `label-content-name-mismatch` en el fallback sin numero.

 const baseClass = getVariantClassName(variant);

 if (isExternal) {
 return (
 <a
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
 <Link className={`${baseClass} ${className}`} href={href}>
 <MessageCircle className={getIconClassName(variant)} strokeWidth={2} />
 <span>{variant === "inline" ? "Te ayudamos a encontrarlo" : label}</span>
 </Link>
 );
}

function getVariantClassName(variant: WhatsAppCtaVariant) {
 if (variant === "floating") {
 return "fixed bottom-5 right-5 z-40 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#128C4A] px-5 text-sm font-black text-white shadow-ca-overlay transition hover:-translate-y-0.5 hover:bg-[#0F7B40]";
 }

 if (variant === "inline") {
 return "inline-flex items-center gap-1.5 text-sm font-black text-ca-blue-700 transition hover:text-ca-navy-950 hover:underline";
 }

 if (variant === "subtle") {
 return "inline-flex h-10 items-center justify-center gap-2 rounded-ca-control border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white";
 }

 return "inline-flex h-11 items-center justify-center gap-2 rounded-ca-control bg-[#128C4A] px-5 text-sm font-black text-white transition hover:bg-[#0F7B40] ";
}

function getIconClassName(variant: WhatsAppCtaVariant) {
 if (variant === "inline") return "h-4 w-4";
 if (variant === "floating") return "h-5 w-5";
 return "h-4 w-4";
}
