import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: 100000 },
        });
      }
    },
  },
});