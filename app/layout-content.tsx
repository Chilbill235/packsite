"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const isPublicPage = pathname === "/login" || pathname === "/register";
    const isAuthenticated = status === "authenticated";

    if (!isAuthenticated && !isPublicPage) {
      router.replace("/login");
    } else if (isAuthenticated && pathname === "/") {
      router.replace("/shop");
    } else {
      setLoading(false);
    }
  }, [status, pathname, router]);

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
          {pathname !== "/login" && pathname !== "/register" && <Navbar />}
          
          {/* Added pt-20 to prevent Navbar overlap */}
          <main className="flex-grow w-full pt-20">
            {children}
          </main>
          
          <Analytics />
        </div>
      )}
    </>
  );
}