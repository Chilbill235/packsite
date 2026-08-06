// auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Module augmentation for TypeScript safety
declare module "next-auth" {
  interface User {
    id?: string;
    username?: string;
    balance?: number;
  }
  interface Session {
    user: {
      id: string;
      username?: string;
      balance?: number;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    sub?: string;
    username?: string;
    balance?: number;
    email?: string;
    picture?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email as string },
              { username: credentials.email as string },
            ],
          },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username || undefined,
          image: user.image || undefined,
          balance: user.balance,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial login: attach initial properties to the token
      if (user) {
        token.sub = user.id;
        token.balance = user.balance;
        token.username = user.username;
        token.email = user.email;
        token.picture = user.image;
        return token;
      }

      // 2. Subsequent calls: sync token with latest DB state
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { email: true, username: true, image: true, balance: true },
        });

        // CRITICAL FIX: If the user no longer exists in DB, wipe the sub property
        if (!dbUser) {
          token.sub = undefined;
          return token;
        }

        token.balance = dbUser.balance;
        token.email = dbUser.email;
        token.username = dbUser.username || undefined;
        token.picture = dbUser.image || undefined;
      }

      return token;
    },

    async session({ session, token }) {
      // If token.sub was cleared because the DB user was missing, return empty session
      if (!token.sub) {
        return { ...session, user: { id: "" } as any };
      }

      if (session.user) {
        session.user.id = token.sub;
        session.user.balance = token.balance;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});