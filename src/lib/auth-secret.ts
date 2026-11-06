import "server-only";

/**
 * Secreto compartido para firmar y hashear cosas de autenticación.
 *
 * Auth.js v5 prefiere `AUTH_SECRET`; `NEXTAUTH_SECRET` sigue siendo alias
 * legado. Esta función existe para que esa doble lectura esté escrita una sola
 * vez: cuando estaba copiada, cada copia podía olvidar el alias y fallar solo
 * en los despliegues que usan la variable vieja.
 *
 * `purpose` entra en el mensaje de error porque el síntoma es siempre el mismo
 * —algo de auth explota— y sin esa pista hay que leer el stack para saber qué
 * pieza se quedó sin secreto.
 */
export function requireAuthSecret(purpose: string): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "";

  if (!secret) {
    throw new Error(`AUTH_SECRET/NEXTAUTH_SECRET es necesario para ${purpose}.`);
  }

  return secret;
}
