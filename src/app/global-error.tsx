"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

/** Root failures can happen before the locale/provider is available. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError("client_boundary"); }, [error]);
  return <html lang="es"><body><main>
    <h1>Ocurrió un error / Something went wrong</h1>
    <p>Intenta de nuevo en unos minutos. / Please try again in a few minutes.</p>
    <button onClick={reset}>Reintentar / Try again</button>
  </main></body></html>;
}
