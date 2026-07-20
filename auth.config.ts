// auth.config.ts - Edge-compatible config for middleware
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
