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
  const { data: session, status } = useSession();

  // --- 1. OneSignal Initialization ---
  useEffect(() => {
    // Only initialize once
    OneSignal.init({
      appId: "7ae5defc-0bad-40c9-9af7-871b24bae250",
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: 'OneSignalSDKWorker.js',
    });
  }, []);

  // --- 2. OneSignal Identity Sync (Cleaned) ---
  useEffect(() => {
    // We simply call login. OneSignal handles the internal queueing, 
    // so it doesn't matter if the SDK is still finishing initialization.
    if (status === "authenticated" && session?.user?.id) {
      OneSignal.login(session.user.id).catch((err) => {
        console.warn("OneSignal login failed:", err);
      });
    }
  }, [status, session]);

  // --- 3. Splash Screen & Force Redirect Logic ---
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

  // --- 4. Handle Browser Back-Forward Cache (BFcache) ---
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