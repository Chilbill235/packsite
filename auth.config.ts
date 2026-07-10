import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; // Import your Prisma instance
import bcrypt from "bcrypt";

export const authConfig = {
  providers: [
    Credentials({
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordsMatch) return { id: user.id, email: user.email };
        
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;