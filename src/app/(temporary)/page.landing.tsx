import { ArrowUpRight, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const t = await getTranslations({ locale: "es", namespace: "Landing" });
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a href="/" className="landing-brand"><span className="landing-mark" aria-hidden="true"><Wrench /></span>{t("brand")}</a>
        <span className="landing-country">El Salvador</span>
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
          <a className="landing-whatsapp" href="https://wa.me/50378907671" target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" />{t("whatsapp")}<ArrowUpRight aria-hidden="true" />
          </a>
          <div className="landing-details">
            <div><Phone aria-hidden="true" /><p><span>{t("phoneLabel")}</span><a href="tel:+50378907671">+503 7890 7671</a></p></div>
            <div><MapPin aria-hidden="true" /><p><span>{t("coverageLabel")}</span>{t("coverage")}</p></div>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><p>{t("brand")}</p><p>{t("footer")}</p></footer>
    </div>
  );
}
