import { SITE_URL } from "./site";

/** Canonical landing origin; independent of store configuration and services. */
export function landingSiteUrl() {
  return new URL(SITE_URL).origin;
}
