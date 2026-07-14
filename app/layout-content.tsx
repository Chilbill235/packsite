"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

// Assuming you use something like localStorage or a state-based auth
// Replace `checkAuthStatus` with your actual authentication check
const checkAuthStatus = () => {
  // Example: return !!localStorage.getItem("user_token");
  return false; 
};

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Minimum display time for the splash animation
    const timer = setTimeout(() => {
      const isAuthenticated = checkAuthStatus();

      if (!isAuthenticated) {
        // Redirecting without setting loading to false first 
        // keeps the splash screen visible until the new page takes over
        router.push("/login");
      } else {
        // Smoothly fade out the splash
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#000000] flex items-center justify-center p-4 animate-in fade-out duration-700">
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