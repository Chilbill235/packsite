// app/layout.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "PackSite",
  description: "Pick and open your packs!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let user = null;

  if (session?.user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { username: true, email: true, balance: true }
      });
      if (dbUser) {
        user = { name: dbUser.username, email: dbUser.email, balance: dbUser.balance };
      }
    } catch (error) {
      console.error("Layout DB fetch failed:", error);
    }
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-adsense-account" content="ca-pub-1167000799645777" />
        <Script 
          async 
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen flex flex-col">
        <Navbar user={user} />
        <main className="flex-grow">{children}</main>
        
        <Script
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}