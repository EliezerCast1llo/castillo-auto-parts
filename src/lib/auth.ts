/**
 * auth.ts — Configuración central de Auth.js v5 para clientes.
 *
 * Proveedores:
 *   - Credentials: email + contraseña (mismo hash scrypt que admin)
 *   - Google: OAuth 2.0
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
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/admin-credentials";

// Validación de secreto en producción
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET?.trim() ?? "";
if (
  process.env.NODE_ENV === "production" &&
  (NEXTAUTH_SECRET.length < 32 || NEXTAUTH_SECRET.includes("replace-with"))
) {
  throw new Error(
    "NEXTAUTH_SECRET no está configurado correctamente para producción. " +
    "Usa `openssl rand -base64 32` para generar un secreto seguro.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },

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
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        if (!user.passwordHash) return null; // cuenta OAuth sin contraseña propia

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Embebe id y role en el JWT en el momento del login
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "CUSTOMER";
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

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
