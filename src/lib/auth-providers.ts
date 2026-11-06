import "server-only";
import type { UserRole } from "@prisma/client";
import { verifyCustomerCredentials } from "@/lib/customer-credentials";
import { db } from "@/lib/db";
import { verifyTwoFactorCode } from "@/lib/two-factor";

/**
 * Los dos `authorize` de Auth.js, fuera del objeto de configuración.
 *
 * Están acá y no inline porque adentro del `NextAuth({...})` no se pueden
 * llamar desde un test, y lo que deciden es exactamente lo que hay que poder
 * probar: cuál de los dos proveedores abre sesión y en qué condiciones.
 */
export type AuthorizedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
};

/**
 * Credenciales: correo y contraseña.
 *
 * **Acá vive la garantía del segundo factor**, y no en la acción del
 * formulario: Auth.js publica el callback de este proveedor como endpoint HTTP,
 * así que la pantalla de ingreso no es la única puerta. Si el rechazo estuviera
 * solo en la acción, un POST directo a `/api/auth/callback/credentials` con la
 * contraseña correcta abriría sesión sin pedir el código y el segundo factor
 * sería decorativo.
 */
export async function authorizeCustomerPassword(
  email: string | undefined,
  password: string | undefined,
): Promise<AuthorizedUser | null> {
  const user = await verifyCustomerCredentials(email, password);

  if (!user) return null;
  if (user.twoFactorEnabled) return null;

  return {
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
    role: user.role,
  };
}

/**
 * Segundo factor: código de seis dígitos.
 *
 * No recibe la contraseña: recibe el desafío, y el desafío solo existe porque
 * la contraseña ya se verificó antes de crearlo. Ese es el invariante que
 * sostiene todo el flujo —si algún día se creara un desafío sin verificar la
 * contraseña, esto se volvería un ingreso con solo el correo—.
 *
 * `challengeId` llega de la cookie firmada, nunca de un campo que el cliente
 * pueda escribir.
 */
export async function authorizeTwoFactorCode(
  challengeId: string | undefined,
  code: string | undefined,
): Promise<AuthorizedUser | null> {
  if (!challengeId || !code) return null;

  const result = await verifyTwoFactorCode(challengeId, code);
  if (!result.ok) return null;

  // Se relee al usuario en vez de confiar en lo que había cuando se creó el
  // desafío: entre el envío del código y su uso pasan hasta diez minutos, y en
  // ese rato la cuenta puede haberse desactivado.
  const user = await db.user.findUnique({
    where: { id: result.userId },
    select: { email: true, id: true, image: true, isActive: true, name: true, role: true },
  });

  if (!user || !user.isActive) return null;

  return {
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
    role: user.role,
  };
}
