// Municipalities under Decreto 762, art. 1. Source:
// https://www.transparenciafiscal.gob.sv/downloads/pdf/700-DGCG-LY-2024-001.pdf
// These are our geographic names, NOT Boxful IDs. #91 supplies verified mappings.
export const municipalitiesByDepartment: Record<string, readonly string[]> = {
  "Ahuachapán": ["Ahuachapán Norte", "Ahuachapán Centro", "Ahuachapán Sur"],
  "Cabañas": ["Cabañas Este", "Cabañas Oeste"],
  "Chalatenango": ["Chalatenango Norte", "Chalatenango Centro", "Chalatenango Sur"],
  "Cuscatlán": ["Cuscatlán Norte", "Cuscatlán Sur"],
  "La Libertad": ["La Libertad Norte", "La Libertad Centro", "La Libertad Oeste", "La Libertad Este", "La Libertad Costa", "La Libertad Sur"],
  "La Paz": ["La Paz Oeste", "La Paz Centro", "La Paz Este"],
  "La Unión": ["La Unión Norte", "La Unión Sur"],
  "Morazán": ["Morazán Norte", "Morazán Sur"],
  "San Miguel": ["San Miguel Norte", "San Miguel Centro", "San Miguel Oeste"],
  "San Salvador": ["San Salvador Norte", "San Salvador Oeste", "San Salvador Este", "San Salvador Centro", "San Salvador Sur"],
  "San Vicente": ["San Vicente Norte", "San Vicente Sur"],
  "Santa Ana": ["Santa Ana Norte", "Santa Ana Centro", "Santa Ana Este", "Santa Ana Oeste"],
  "Sonsonate": ["Sonsonate Norte", "Sonsonate Centro", "Sonsonate Este", "Sonsonate Oeste"],
  "Usulután": ["Usulután Norte", "Usulután Este", "Usulután Oeste"],
};

export const departments = Object.keys(municipalitiesByDepartment);
export function getMunicipalities(department?: string): readonly string[] {
  return department && Object.hasOwn(municipalitiesByDepartment, department) ? municipalitiesByDepartment[department] : [];
}
export function isNationalAddress(department?: string, city?: string) {
  return Boolean(city && getMunicipalities(department).includes(city));
}

// Country-wide coordinate envelope, including islands. This is an input sanity
// check, not courier coverage: the rate provider determines service availability.
export function isNationalCoordinate(latitude?: number, longitude?: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude! >= 13.1 && latitude! <= 14.5 && longitude! >= -90.2 && longitude! <= -87.6;
}

export type BoxfulLocationMapping = { stateId: string; cityId: string };
export const boxfulLocationMappings: Record<string, BoxfulLocationMapping> = {};
