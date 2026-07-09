import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize() {
        return null; // Left blank intentionally for Edge runtime safety
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;