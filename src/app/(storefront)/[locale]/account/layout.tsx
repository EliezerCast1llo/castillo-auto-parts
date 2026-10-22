import { auth } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";

// Protege todas las rutas /account/**
export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // El idioma sale de los params de la ruta, no de `getLocale()`: en un layout
  // anidado ese helper no resuelve el segmento y cae al idioma por defecto,
  // asi que el guard mandaria a todo el mundo al login en espanol.
  const locale = await resolveAndPublishRouteLocale(params);
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: { pathname: "/auth/login", query: { next: "/account" } }, locale });
  }
  return <>{children}</>;
}
