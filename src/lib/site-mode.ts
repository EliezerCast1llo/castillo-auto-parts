/** Build-time selection. Set the same mode at build and runtime, then rebuild to change it. */
export function isLandingMode(environment: Record<string, string | undefined> = process.env) {
  return environment.SITE_MODE === "landing";
}

export function sitePageExtensions(environment: Record<string, string | undefined> = process.env) {
  // Undefined preserves Next's defaults, including every existing store route/hook.
  return isLandingMode(environment) ? ["landing.tsx", "landing.ts"] : undefined;
}
