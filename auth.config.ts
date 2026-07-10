// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // No DB imports here!
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;