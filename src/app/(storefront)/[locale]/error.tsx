"use client";

import { reportClientError } from "@/lib/client-monitoring";
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
    reportClientError("client_boundary");
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ca-bg px-4 text-ca-text">
      <div className="w-full max-w-md rounded-ca-surface border border-ca-border bg-ca-surface p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-ca-control bg-ca-navy text-white">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-bold text-ca-text-secondary">
          {t("badge")}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ca-navy">
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
