/**
 * Auth.js v5 configuration.
 *
 * v1 uses Credentials provider + JWT sessions. The DrizzleAdapter is NOT
 * needed here — it's only required for OAuth/database sessions. We may add
 * it later when OAuth providers are introduced.
 *
 * See ADR-0005 for the full auth design.
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword, CredentialsInputSchema } from "@hawza/core/auth";
import { getDb } from "@hawza/core/db";
import type { Role } from "@hawza/core/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      tenantId: string;
    };
  }
}

const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? "dev-secret-change-in-production",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        tenantSlug: { label: "Tenant", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsInputSchema.safeParse(raw);
        if (!parsed.success) return null;
        const result = await verifyPassword(getDb(), parsed.data);
        if (!result.ok) return null;
        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.displayName,
          role: result.user.role,
          tenantId: result.user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: Role; tenantId: string };
        token.id = u.id;
        token.role = u.role;
        token.tenantId = u.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const _nextAuth = NextAuth(authConfig);

export const handlers = _nextAuth.handlers;
export const auth = _nextAuth.auth;
export const signIn: typeof _nextAuth.signIn = _nextAuth.signIn;
export const signOut: typeof _nextAuth.signOut = _nextAuth.signOut;
