import { Wrench } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SITE_NAME } from "@/lib/site";
export function BrandLockup() {
  return (
    <Link aria-label={SITE_NAME} className="inline-flex shrink-0 items-center gap-2" href="/">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ca-control bg-ca-navy text-white">
        <Wrench aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="max-w-18 text-sm font-bold leading-4 text-ca-navy sm:max-w-none">{SITE_NAME}</span>
    </Link>
  );
}
