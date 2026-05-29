/** Rutas seguras para redirigir después del login de cliente. */
export function getSafeCustomerNextPath(value: string | undefined): string {
  const allowed =
    value &&
    value.startsWith("/") &&
    !value.startsWith("/admin") &&
    !value.startsWith("/auth/login");

  return allowed ? value : "/account";
}
