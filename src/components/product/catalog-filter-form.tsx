"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type CatalogFilterFormProps = {
  children: ReactNode;
};

export function CatalogFilterForm({ children }: CatalogFilterFormProps) {
  const router = useRouter();

  return (
    <form
      action="/catalog"
      className="space-y-4"
      onChange={(event) => {
        const target = event.target;

        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
          return;
        }

        if (target.type === "search" || target.name === "q") {
          return;
        }

        event.currentTarget.requestSubmit();
      }}
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        const formData = new FormData(event.currentTarget);

        for (const [key, value] of formData.entries()) {
          const textValue = String(value).trim();

          if (textValue) {
            params.append(key, textValue);
          }
        }

        const query = params.toString();
        router.push(query ? `/catalog?${query}` : "/catalog", { scroll: false });
      }}
    >
      {children}
    </form>
  );
}
