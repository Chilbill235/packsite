"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

// Define the paths where the splash screen SHOULD show
const APP_PATHS = ["/", "/dashboard", "/packs"]; 

// Replace with your actual auth check logic
const checkAuthStatus = () => {
  return false; 
};

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. If the current page is NOT in our APP_PATHS list, skip the splash
    if (!APP_PATHS.includes(pathname)) {
      setLoading(false);
      return;
    }

    // 2. Otherwise, run the splash timer for app pages
    const timer = setTimeout(() => {
      const isAuthenticated = checkAuthStatus();

      if (!isAuthenticated) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, pathname]);

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#000000] flex items-center justify-center p-4">
          <img 
            src="/splash/apple-splash-2048-2732.jpg" 
            alt="Loading" 
            className="w-auto h-auto max-w-[70%] max-h-[70%] animate-pulse object-contain" 
          />
        </div>
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
      <Script src="https://quge5.com/88/tag.min.js" strategy="afterInteractive" data-zone="258926" data-cfasync="false" async />
      <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777" crossOrigin="anonymous" strategy="afterInteractive" />
    </>
  );
}