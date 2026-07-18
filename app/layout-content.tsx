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
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only proceed if session status is resolved
    if (status === "loading") return;

    const isPublicPage = pathname === "/login" || pathname === "/register";
    const isAuthenticated = status === "authenticated";

    if (!isAuthenticated && !isPublicPage) {
      router.replace("/login");
    } else if (isAuthenticated && pathname === "/") {
      router.replace("/shop");
    } else {
      // Trigger the exit animation after a minimum 1.5s display
      const timer = setTimeout(() => {
        setFadeOut(true);
        // Remove the splash screen from the DOM after the 800ms animation finishes
        setTimeout(() => setLoading(false), 800);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, pathname, router]);

  return (
    <>
      {/* Splash Screen Overlay */}
      {loading && (
        <div 
          className={`fixed inset-0 z-[9999] w-screen h-screen bg-[#030712] flex items-center justify-center overflow-hidden transition-all duration-800 ease-in-out ${
            fadeOut ? "opacity-0 scale-110 blur-md pointer-events-none" : "opacity-100 scale-100 blur-0"
          }`}
        >
          <style>{`
            .glowing-orb {
              background: radial-gradient(circle at 30% 30%, #38bdf8, #818cf8, #c084fc, #030712);
              background-size: 200% 200%;
              animation: morphOrb 4s ease-in-out infinite alternate, gradientShift 3s linear infinite;
              box-shadow: 0 0 40px 10px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.5);
            }
            .ring-spin-slow { animation: spinSlow 8s linear infinite; }
            .ring-spin-reverse { animation: spinReverse 6s linear infinite; }
            .text-shimmer {
              background: linear-gradient(90deg, #4b5563 0%, #f9fafb 50%, #4b5563 100%);
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
              animation: shimmerText 2s linear infinite;
            }
            @keyframes morphOrb {
              0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
              50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
              100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            }
            @keyframes gradientShift { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
            @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            @keyframes shimmerText { to { background-position: 200% center; } }
            @keyframes slideRight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          `}</style>

          <div className="absolute inset-0 z-0 opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 flex flex-col items-center justify-center gap-12">
            <div className="relative flex items-center justify-center w-40 h-40">
              <div className="absolute w-40 h-40 border border-dashed border-slate-700 rounded-full ring-spin-slow opacity-60" />
              <div className="absolute w-32 h-32 rounded-full border-t-2 border-r-2 border-indigo-500 ring-spin-reverse opacity-80" />
              <div className="relative w-20 h-20 glowing-orb" />
            </div>

            <div className="flex flex-col items-center gap-2 tracking-[0.3em]">
              <h2 className="text-sm font-semibold uppercase text-shimmer">Initializing System</h2>
              <div className="w-48 h-[2px] bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 w-full" 
                     style={{ animation: 'slideRight 1.5s ease-in-out infinite' }}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App Content - Always rendered to ensure state is ready */}
      <div className="min-h-screen flex flex-col">
        {pathname !== "/login" && pathname !== "/register" && <Navbar />}
        
        <main className="flex-grow w-full pt-20">
          {children}
        </main>
        
        <Analytics />
      </div>
    </>
  );
}