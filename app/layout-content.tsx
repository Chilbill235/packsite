"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";
import OneSignal from "react-onesignal";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(pathname === "/");
  const router = useRouter();
  const { status } = useSession();

  // --- 1. Service Worker & OneSignal Initialization ---
  useEffect(() => {
    // Initialize OneSignal
    OneSignal.init({
      appId: "7ae5defc-0bad-40c9-9af7-871b24bae250", // REPLACE WITH YOUR ACTUAL APP ID
      allowLocalhostAsSecureOrigin: true,
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/serviceWorker.js", { scope: "/" })
        .then(reg => console.log("Service Worker registered globally:", reg.scope))
        .catch(err => console.error("Global Service Worker registration failed:", err));
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
          
          {/* --- Monetag Integration --- */}
          <Script 
            src="https://quge5.com/88/tag.min.js" 
            strategy="afterInteractive" 
            data-zone="258926" 
            data-cfasync="false" 
          />

          {/* --- Optimized Google AdSense Integration --- */}
          <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1167000799645777"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        </div>
      )}
    </>
  );
}