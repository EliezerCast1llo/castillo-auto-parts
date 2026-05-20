export function shouldUseMockCatalogFallback(environment = process.env.NODE_ENV) {
  return environment !== "production";
}
