import Link from "next/link";
import { ArrowRight } from "lucide-react";

const brands = [
  "TOYOTA",
  "HYUNDAI",
  "KIA",
  "NISSAN",
  "CHEVROLET",
  "MAZDA",
  "HONDA",
  "BOSCH",
  "NGK",
  "WIX",
];

export function BrandStrip() {
  return (
    <section className="animate-fade-up delay-100 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-ca-gold-400" />
          <h2
            className="text-xl text-ca-navy-950"
            style={{ fontFamily: "var(--font-display), ui-sans-serif", fontWeight: 800, letterSpacing: "0.02em" }}
          >
            Marcas destacadas
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
          href="/catalog"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {brands.map((brand, i) => (
          <Link
            className="ca-card-lift group flex h-[52px] items-center justify-center rounded-xl border border-ca-border bg-white px-3 text-center shadow-[0_2px_8px_rgba(6,25,51,0.04)]"
            href={`/catalog?brand=${encodeURIComponent(brand)}`}
            key={brand}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <span
              className="text-[11px] font-black tracking-[0.12em] text-ca-navy-900 transition group-hover:text-ca-blue-700"
              style={{ fontFamily: "var(--font-display), ui-sans-serif" }}
            >
              {brand}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
