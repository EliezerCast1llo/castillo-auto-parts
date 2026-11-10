import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildContactLinks } from "@/lib/contact";

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
 label,
 message,
 phone,
 variant = "button",
}: WhatsAppCtaProps) {
 const t = useTranslations("Common.whatsapp");
 const resolvedLabel = label ?? t("consult");
 // WhatsApp es un destino externo y no pasa por el ruteo de idiomas; el
 // fallback si, y su ruta interna se llama `/help` aunque en espanol se sirva
 // como `/ayuda`.
 const whatsappUrl = phone
 ? buildContactLinks(phone, message ?? t("message")).whatsapp
 : null;
 // El texto visible da el nombre accesible, incluido el fallback localizado.

 const baseClass = variant === "inline"
   ? "inline-flex items-center gap-2 text-sm font-semibold text-ca-navy hover:underline"
   : cn(
       buttonVariants({
         variant: whatsappUrl && variant !== "subtle" ? "whatsapp" : variant === "subtle" ? "outline" : "primary",
         size: variant === "subtle" ? "md" : "lg",
       }),
       variant === "floating" && "fixed bottom-4 right-4 z-40",
     );

 if (whatsappUrl) {
 return (
 <a
 className={cn(baseClass, className)}
 href={whatsappUrl}
 rel="noopener noreferrer"
 target="_blank"
 >
 <MessageCircle aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
 <span>{resolvedLabel}</span>
 </a>
 );
 }

 return (
 <Link className={cn(baseClass, className)} href="/help">
 <MessageCircle aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
 <span>{variant === "inline" ? t("helpFind") : resolvedLabel}</span>
 </Link>
 );
}
