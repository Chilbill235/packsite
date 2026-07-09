import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PACKSITE",
  description: "Open your favorite booster packs!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let user = null;

  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true, email: true, balance: true }
    });
    if (dbUser) user = { name: dbUser.username, email: dbUser.email, balance: dbUser.balance };
  }

  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
      </head>
      <body className="bg-black text-zinc-100 antialiased">
        <Navbar user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}