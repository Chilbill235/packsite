"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // --- FIX: Initialize loading state based on the current page path ---
  const [loading, setLoading] = useState(pathname === "/");
  
  const router = useRouter();
  const { status } = useSession(); // Access Next-Auth session state directly[cite: 3]

  // --- 1. Service Worker Registration with Type: Module ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw1.js', { 
        scope: '/',
        type: 'module' // <-- FIX: Resolves ES Module import/syntax errors
      })
      .catch((err) => console.error('SW1 registration failed:', err));
    }
  }, []);

  // --- 2. Splash Screen & Force Redirect Logic ---
  useEffect(() => {
    if (pathname !== "/") {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (status === "loading") {
      return;
    }

    const timer = setTimeout(() => {
      if (status === "authenticated") {
        router.replace("/shop");
      } else {
        setLoading(false); 
      }
    }, 4000); 

    return () => clearTimeout(timer);
  }, [router, pathname, status]);

  // --- 3. Handle Browser Back-Forward Cache (BFcache) ---
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (pathname === "/") {
        setLoading(true);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname]);

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
          <InstallPrompt />
          <Navbar />
          <main className="flex-grow">{children}</main>
          
          <Analytics />
          
          <Script 
            src="https://quge5.com/88/tag.min.js" 
            strategy="afterInteractive" 
            data-zone="258926" 
            data-cfasync="false" 
          />
        </div>
      )}
    </>
  );
}