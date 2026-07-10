// lib/auth-edge.ts
import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";

// This instance DOES NOT use Prisma or Bcrypt
export const { auth } = NextAuth(authConfig);