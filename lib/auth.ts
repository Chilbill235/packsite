import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extended TypeScript module declaration mappings
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
    };
  }
  interface User {
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string | null;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier }
            ]
          }
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.username) session.user.username = token.username;
      }
      return session;
    }
  }
});