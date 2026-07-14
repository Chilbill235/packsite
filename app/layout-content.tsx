"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/app/providers";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";
// Import your auth hook here. Example:
// import { useAuth } from "@/context/AuthContext"; 

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // const { user, loading: authLoading } = useAuth(); // Example usage

  useEffect(() => {
    const timer = setTimeout(async () => {
      // 1. Logic to check if user is logged in
      const isAuthenticated = false; // Replace with your actual auth check logic

      if (!isAuthenticated) {
        // 2. Redirect if not logged in
        router.push("/login");
      } else {
        // 3. Stop showing the splash screen if logged in
        setLoading(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

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