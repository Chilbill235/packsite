"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show splash for 2 seconds
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]">
          <img src="/splash/apple-icon-180.png" alt="Loading" className="w-32 h-32 animate-pulse" />
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <Providers>
            <InstallPrompt />
            <Navbar />
            <main className="flex-grow">{children}</main>
          </Providers>
        </div>
      )}

      <Analytics />
      <Script src="https://quge5.com/88/tag.min.js" strategy="afterInteractive" data-zone="258926" data-cfasync="false" async />
      <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777" crossOrigin="anonymous" strategy="afterInteractive" />
    </>
  );
}