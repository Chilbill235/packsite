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
    image?: string;
  }
  interface Session {
    user: {
      id: string;
      username?: string;
      balance?: number;
      image?: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    sub?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
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
      if (user) {
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (!token.sub) {
        return { ...session, user: { id: "" } as any };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, username: true, balance: true, image: true, email: true },
      });

      if (!dbUser) {
        return { ...session, user: { id: "" } as any };
      }

      session.user.id = dbUser.id;
      session.user.username = dbUser.username;
      session.user.balance = dbUser.balance;
      session.user.image = dbUser.image;
      session.user.email = dbUser.email;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});