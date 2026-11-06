import "server-only";
import type { UserRole } from "@prisma/client";
import { verifyPassword } from "@/lib/admin-credentials";
import { db } from "@/lib/db";

/**
 * Verificación de email + contraseña de un cliente.
 *
 * Vivía dentro del `authorize` del proveedor de credenciales, y ahí no servía:
 * con segundo factor la acción de ingreso necesita saber si la contraseña es
 * correcta **sin** crear la sesión, porque entre una cosa y la otra hay que
 * mandar un código. `signIn("credentials")` hace las dos en el mismo paso.
 *
 * Es una sola función y no dos copias porque las dos copias contestan la
 * pregunta "¿quién es este cliente?" y tienen que contestarla igual: si una
 * dejara de mirar `isActive`, habría un camino por el que entra una cuenta
 * desactivada y otro por el que no.
 */
export type VerifiedCustomer = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  twoFactorEnabled: boolean;
};

export async function verifyCustomerCredentials(
  email: string | undefined,
  password: string | undefined,
): Promise<VerifiedCustomer | null> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) return null;

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      image: true,
      isActive: true,
      name: true,
      passwordHash: true,
      role: true,
      twoFactorEnabled: true,
    },
  });

  if (!user || !user.isActive) return null;
  if (!user.passwordHash) return null; // cuenta OAuth sin contraseña propia

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    image: user.image,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

/**
 * Oculta el correo para mostrarlo en la pantalla del código.
 *
 * La pantalla tiene que decir a dónde fue el código —si no, quien tenga dos
 * cuentas no sabe qué bandeja abrir— pero no puede escribirlo entero: es una
 * página a la que se llega con solo la contraseña, y ahí el correo completo
 * sería un dato que se regala.
 *
 * Se deja la primera letra y el dominio, que es lo que alcanza para reconocer
 * la cuenta propia sin describir una ajena.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");

  // Sin arroba no hay nada que preservar: se devuelve enmascarado completo en
  // vez de mostrar un valor que no se entendió.
  if (at <= 0) return "•••";

  const local = email.slice(0, at);
  const domain = email.slice(at);

  return `${local.slice(0, 1)}${"•".repeat(Math.max(local.length - 1, 1))}${domain}`;
}
