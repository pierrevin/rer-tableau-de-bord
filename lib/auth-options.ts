import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      auteurId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    auteurId?: string | null;
  }
}

const baseCredentialsProvider = CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Mot de passe", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;
    const email = credentials.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user?.passwordHash) return null;
    const ok = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!ok) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      auteurId: user.auteurId,
    };
  },
});

const providers: NextAuthOptions["providers"] = [baseCredentialsProvider];

// Provider d'impersonation pour la phase de bêta (non activé en production).
if (process.env.NODE_ENV !== "production") {
  providers.push(
    CredentialsProvider({
      id: "impersonate",
      name: "Impersonation (beta)",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          auteurId: user.auteurId,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "auteur";
        token.auteurId = (user as { auteurId?: string | null }).auteurId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.auteurId = token.auteurId;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

