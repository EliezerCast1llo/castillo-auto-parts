import { UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { firstValue } from "@/lib/url-utils";
import { asLocaleHref, redirect } from "@/lib/i18n/navigation";
import { getStatusMessage } from "@/lib/i18n/status";
import { resolveRouteLocale } from "@/lib/i18n/params";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: { follow: false, index: false },
  title: "Crear cuenta | Castillo Auto Parts",
};

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ params: routeParams, searchParams }: RegisterPageProps) {
  const locale = await resolveRouteLocale(routeParams);
  const session = await auth();
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeCustomerNextPath(firstValue(params.next));
  const errorMessage = await getStatusMessage("auth", firstValue(params.estado), locale);

  if (session?.user) redirect({ href: asLocaleHref(nextPath), locale });

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ca-navy-950 text-white shadow-ca-button-hover">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">Bienvenido</p>
              <h1 className="text-2xl font-black text-ca-navy-950">Crear cuenta</h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-ca-border bg-white p-6 shadow-ca-premium">
            <RegisterForm nextPath={nextPath} errorMessage={errorMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}

