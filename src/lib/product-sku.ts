export const SKU_FORMAT_MESSAGE = "El SKU es obligatorio y admite hasta 64 caracteres: letras A-Z sin tildes, números, punto, guion, barra o guion bajo; debe empezar por letra o número. Se guarda en mayúsculas y sin espacios.";

export function normalizeCatalogSku(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

/** Validate before uppercasing: Unicode such as ß must not become valid ASCII. */
export function isValidCatalogSku(value: string) {
  const compact = value.replace(/\s+/g, "");
  return compact.length <= 64 && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(compact);
}

// Matches JavaScript's \s for the PostgreSQL identity lookup as well.
export const SKU_WHITESPACE = " \t\r\n\f\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";
