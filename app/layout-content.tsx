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
        // Container set to 70% background size to create a "zoomed out" effect
        <div 
          className="fixed inset-0 z-[9999] w-screen h-screen"
          style={{
            backgroundColor: '#000000',
            backgroundImage: "url('/splash/apple-splash-2048-2732.jpg')",
            backgroundSize: "70%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />
      ) : (
        <div className="animate-in fade-in duration-500 min-h-screen flex flex-col">
          <Providers>
            <InstallPrompt />
            <Navbar />
            <main className="flex-grow">{children}</main>
          </Providers>
        </div>
      )}

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
    </>
  );
}