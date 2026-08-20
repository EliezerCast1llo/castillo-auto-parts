"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors.unexpected");
  const tCommon = useTranslations("Common");

  useEffect(() => {
    // El error ya queda registrado por Next en servidor; aquí solo consola local.
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ca-background px-4 text-ca-text-primary">
      <div className="w-full max-w-md rounded-2xl border border-ca-border bg-white p-8 text-center shadow-ca-premium">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ca-navy-950 text-white">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-widest text-ca-gold-500">
          {t("badge")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-black text-ca-navy-950">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ca-text-secondary">
          {t("description")}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>{tCommon("retry")}</Button>
          <Link className={cn(buttonVariants({ variant: "outline" }), "font-bold")} href="/">
            {tCommon("backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
