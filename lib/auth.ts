import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend Next-Auth's default types to include user.id and customized fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    username?: string | null;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Using JWT strategy to ensure session callbacks work seamlessly
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) return null;

        // NOTE: Securely compare your password here:
        // const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        // if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          username: user.username,
        };
      }
    })
  ],
  callbacks: {
    // Inject user.id from the token into the active session object
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    // Ensure the token captures the database user's unique ID on login
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  }
});