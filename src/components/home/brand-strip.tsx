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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-ca-navy-950">Marcas destacadas</h2>
        <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-ca-blue-700" href="/catalog">
          Ver todas las marcas
          <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {brands.map((brand) => (
          <Link
            className="flex h-[52px] min-h-[52px] items-center justify-center rounded-[12px] border border-ca-border bg-white px-3 text-center text-sm font-black tracking-wide text-ca-navy-900 shadow-[0_6px_18px_rgba(6,25,51,0.04)] transition hover:-translate-y-0.5 hover:border-[#c3cfdd]"
            href={`/catalog?brand=${encodeURIComponent(brand)}`}
            key={brand}
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  );
}
