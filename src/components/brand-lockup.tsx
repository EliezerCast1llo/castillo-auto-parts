import { Wrench } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SITE_NAME } from "@/lib/site";

export function BrandLockup({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link aria-label={SITE_NAME} className="inline-flex shrink-0 items-center gap-2" href="/">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ca-control bg-ca-accent text-ca-navy">
        <Wrench aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className={`font-display text-lg font-bold leading-none tracking-[0.03em] ${onDark ? "text-white" : "text-ca-navy"}`}>
        <span className="block">CASTILLO</span>
        <span className="block text-sm">AUTO PARTS</span>
      </span>
    </Link>
  );
}
