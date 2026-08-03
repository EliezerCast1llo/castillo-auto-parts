/**
 * Catálogo canónico de marcas de vehículo.
 *
 * Las compatibilidades se guardan como strings libres en la DB
 * (VehicleCompatibility.make/model); para evitar duplicados por casing o
 * espacios ("toyota" vs "Toyota", "land rover" vs "Land Rover") se
 * canonicaliza en el punto de escritura (admin) contra esta lista.
 * Las marcas fuera de la lista se aceptan igual, normalizadas a Title Case.
 */
export const CANONICAL_MAKES = [
  "Alfa Romeo",
  "Chevrolet",
  "Ford",
  "Great Wall",
  "Honda",
  "Hyundai",
  "Isuzu",
  "Kia",
  "Land Rover",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Suzuki",
  "Toyota",
  "Volkswagen",
] as const;

/**
 * Busca la marca canónica que coincide (case-insensitive, espacios colapsados)
 * con el texto dado. Devuelve undefined si no hay match.
 */
export function findCanonicalMake(value: string): string | undefined {
  const normalized = normalizeForComparison(value);
  return CANONICAL_MAKES.find((make) => normalizeForComparison(make) === normalized);
}

/**
 * Intenta separar "marca + modelo" de un texto libre usando longest-prefix
 * match contra las marcas canónicas ("Land Rover Defender" → make "Land Rover",
 * model "Defender"). Si ninguna marca canónica es prefijo, cae al comportamiento
 * histórico: primera palabra = marca.
 */
export function splitMakeAndModel(value: string): { make: string; model: string } | null {
  const words = collapseSpaces(value).split(" ");
  if (words.length < 2) return null;

  // Longest-prefix primero: probar prefijos largos antes que cortos para que
  // "Alfa Romeo Giulietta" no se parta en make "Alfa".
  for (let end = words.length - 1; end >= 1; end -= 1) {
    const candidate = words.slice(0, end).join(" ");
    const canonical = findCanonicalMake(candidate);

    if (canonical) {
      return { make: canonical, model: words.slice(end).join(" ") };
    }
  }

  return { make: toTitleCase(words[0]), model: words.slice(1).join(" ") };
}

/**
 * Normaliza make/model para persistencia: trim, espacios colapsados, marca
 * canonicalizada (o Title Case si es desconocida). El modelo conserva su
 * casing original salvo trim/colapso (nombres como "CR-V" o "4Runner").
 */
export function canonicalizeVehicle({ make, model }: { make: string; model: string }) {
  const cleanMake = collapseSpaces(make);
  const cleanModel = collapseSpaces(model);

  return {
    make: findCanonicalMake(cleanMake) ?? toTitleCase(cleanMake),
    model: cleanModel,
  };
}

/** Slug de URL para una marca ("Land Rover" → "land-rover"). */
export function vehicleMakeSlug(make: string) {
  return collapseSpaces(make)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Resuelve un slug de URL a la marca tal como existe en el catálogo. */
export function findMakeBySlug(slug: string, makes: string[]): string | undefined {
  return makes.find((make) => vehicleMakeSlug(make) === slug);
}

function collapseSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeForComparison(value: string) {
  return collapseSpaces(value).toLowerCase();
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
