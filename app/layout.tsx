import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Metadata } from "next";
import Script from "next/script";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "PackSite",
  description: "Pick and open your packs!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen flex flex-col">
        <Providers>
          <InstallPrompt />
          <Navbar />
          <main className="flex-grow">{children}</main>
        </Providers>

        <Analytics />

        <Script
          src="https://quge5.com/88/tag.min.js"
          strategy="afterInteractive"
          data-zone="258926"
          data-cfasync="false"
          async
        />

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