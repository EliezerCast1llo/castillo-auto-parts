/**
 * auth.ts — Configuración central de Auth.js v5 para clientes.
 *
 * Proveedores:
 *   - Credentials: email + contraseña (mismo hash scrypt que admin). Rechaza a
 *     las cuentas con segundo factor encendido: esas entran por "two-factor".
 *   - two-factor: código de seis dígitos enviado al correo
 *   - Google: OAuth 2.0 (sin segundo factor propio: Google ya pide el suyo)
 *
 * Estrategia JWT (stateless cookies) para compatibilidad con Edge Runtime.
 * El PrismaAdapter se usa solo para persistir cuentas OAuth (Account model).
 *
 * Tipos extendidos en src/types/next-auth.d.ts
 */

import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { UserRole } from "@prisma/client";
import { mergeGuestCartIntoAccount } from "@/lib/cart-store";
import { db } from "@/lib/db";
import { authorizeCustomerPassword, authorizeTwoFactorCode } from "@/lib/auth-providers";
import { logError } from "@/lib/logger";
import { canSignInWithOAuthProfile } from "@/lib/oauth-profile";
import { getStoreSetting } from "@/lib/store-settings";
import { defaultLocale } from "@/lib/i18n/config";

// Validación de secreto en producción. Auth.js v5 prefiere AUTH_SECRET;
// NEXTAUTH_SECRET se mantiene como alias legado por compatibilidad.
const AUTH_SECRET = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "";
if (
  process.env.NODE_ENV === "production" &&
  (AUTH_SECRET.length < 32 || AUTH_SECRET.includes("replace-with"))
) {
  throw new Error(
    "AUTH_SECRET/NEXTAUTH_SECRET no está configurado correctamente para producción. " +
    "Usa `openssl rand -base64 32` para generar un secreto seguro.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      // Rechaza a las cuentas con segundo factor encendido; el porqué y su
      // prueba están en auth-providers.ts.
      authorize: (credentials) =>
        authorizeCustomerPassword(
          credentials?.email as string | undefined,
          credentials?.password as string | undefined,
        ),
    }),

    Credentials({
      id: "two-factor",
      name: "Código de verificación",
      credentials: {
        challengeId: { label: "Desafío", type: "text" },
        code: { label: "Código", type: "text" },
      },
      authorize: (credentials) =>
        authorizeTwoFactorCode(
          credentials?.challengeId as string | undefined,
          credentials?.code as string | undefined,
        ),
    }),
  ],

  callbacks: {
    signIn({ account, profile }) {
      return canSignInWithOAuthProfile({
        provider: account?.provider,
        profile,
      });
    },

    // Embebe id y role en el JWT; revalida rol/isActive contra BD cada 60 s.
    // Devolver null invalida la sesión (usuario desactivado o eliminado).
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "CUSTOMER";
        token.roleValidatedAt = Date.now();
        return token;
      }

      const lastValidated = (token.roleValidatedAt as number | undefined) ?? 0;
      if (Date.now() - lastValidated > 60_000) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true },
        });

        if (!fresh || !fresh.isActive) return null;

        token.role = fresh.role;
        token.roleValidatedAt = Date.now();
      }

      return token;
    },

    // Expone id y role en session.user para Server Components y Client Components
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },

  events: {
    /**
     * Pasa el carrito del navegador a la cuenta al entrar.
     *
     * Va en el evento y no en los formularios de ingreso porque los formularios
     * no son todos los caminos: el regreso de Google entra por el manejador de
     * ruta de Auth.js y nunca pasa por una acción nuestra. El evento corre en
     * los tres proveedores.
     *
     * Y no puede ir en la lectura del carrito, que sería el otro lugar obvio:
     * la fusión tiene que borrar la cookie, y las cookies no se escriben
     * mientras se renderiza una página.
     *
     * Falla en silencio a propósito: perder la fusión deja el carrito en el
     * navegador, que es molesto; tirar acá dejaría a la persona sin poder
     * entrar, que es peor. El ajuste apagado la saltea entera.
     */
    async signIn({ user }) {
      if (!user?.id) return;

      try {
        if (!(await getStoreSetting("persistentCart"))) return;
        await mergeGuestCartIntoAccount(user.id);
      } catch (error) {
        logError({ context: "mergeGuestCartIntoAccount", userId: user.id }, error);
      }
    },
  },

  // Config estática: next-auth resuelve estas rutas fuera de cualquier request
  // con segmento de idioma, así que no puede conocer el locale del visitante.
  // Se apunta al idioma principal para no depender del redirect legacy; quien
  // navegue en inglés y caiga acá por un error de OAuth vera el login en
  // español, que es la degradación aceptable mientras la config sea estática.
  pages: {
    signIn: `/${defaultLocale}/auth/login`,
    error: `/${defaultLocale}/auth/login`,
  },
});
