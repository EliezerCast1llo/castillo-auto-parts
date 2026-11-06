import Link from "next/link";
import { ArrowUpRight, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildContactLinks } from "@/lib/contact";
import { LandingLocaleSwitch } from "./landing-locale-switch";
import { resolveLandingLocale } from "./landing-locale";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const locale = await resolveLandingLocale();
  const t = await getTranslations({ locale, namespace: "Landing" });
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const contact = buildContactLinks();
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Link href="/" prefetch={false} className="landing-brand"><span className="landing-mark" aria-hidden="true"><Wrench /></span>{t("brand")}</Link>
        <div className="landing-header-actions">
          <span className="landing-country">El Salvador</span>
          <LandingLocaleSwitch current={locale} label={tNav("languageSwitch")} />
        </div>
      </header>
      <main className="landing-main">
        <section className="landing-intro">
          <p className="landing-eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className="landing-description">{t("description")}</p>
          <p className="landing-status"><span aria-hidden="true" />{t("status")}</p>
        </section>
        <section className="landing-contact" aria-labelledby="contact-heading">
          <span className="landing-contact-icon" aria-hidden="true"><MessageCircle /></span>
          <h2 id="contact-heading">{t("contactTitle")}</h2>
          <p>{t("contactDescription")}</p>
          <a className="landing-whatsapp" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" />{t("whatsapp")}<ArrowUpRight aria-hidden="true" />
          </a>
          <div className="landing-details">
            <div><Phone aria-hidden="true" /><p><span>{t("phoneLabel")}</span><a href={contact.telephone}>{contact.displayPhone}</a></p></div>
            <div><MapPin aria-hidden="true" /><p><span>{t("coverageLabel")}</span>{t("coverage")}</p></div>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><p>{t("brand")}</p><p>{t("footer")}</p></footer>
    </div>
  );
}
