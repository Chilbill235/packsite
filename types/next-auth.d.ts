import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    balance: number;
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      balance: number; // Add this
    };
  }
}