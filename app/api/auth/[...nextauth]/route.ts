import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";

import { prisma } from "../../../../lib/prisma";
import { authConfig } from "../../../../auth.config";

// Initialize NextAuth with the events callback to grant starting coins
const { handlers } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.username };
      },
    }),
  ],
  session: {
    strategy: "jwt"
  },
  // The event triggers immediately after a new user record is created in the database
  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        // Automatically updates the new user's balance to 10,000
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: 100000 },
        });
      }
    },
  },
});

// Export handlers
export const GET = handlers.GET;
export const POST = handlers.POST;