"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, LogOut, Store, User, Home, Sparkles } from "lucide-react";
import { useBalanceSync } from "@/hooks/useBalanceSync";
import Balance from "./Balance";
import { useProgression } from "@/context/ProgressionContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const [balance, setBalance] = useState<number>(0);
  const { accountLevel } = useProgression();

  // Centralized balance sync
  useBalanceSync((newBalance) => setBalance(newBalance));

  // Initial fetch on auth state change
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.balance === "number") {
          setBalance(data.balance);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV !== "development") {
          window.console.error("Failed to sync live balance:", new Error("fetch failed"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Re-sync on tab focus
  useEffect(() => {
    const refresh = async () => {
      if (!isAuthenticated) return;
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.balance === "number") setBalance(data.balance);
      }
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [isAuthenticated]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: Store },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#040406]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="group flex items-center gap-2.5 text-2xl font-black tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
                <Sparkles size={18} className="fill-black" />
              </div>
              <span className="bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                PACKSITE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5 bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl backdrop-blur-xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-amber-400" : "text-zinc-400"} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop & Mobile Action Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Balance Trigger */}
                <button
                  onClick={() => window.dispatchEvent(new Event("openShopBalanceModal"))}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner cursor-pointer"
                  title="Earn Balance / Watch Ads"
                >
                  <Balance amount={balance} className="text-xs sm:text-sm font-black text-amber-300 tracking-wide" />
                </button>

                {/* Desktop Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>

                {/* Mobile Menu Toggle (iOS Optimized Touch Target) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 focus:outline-none md:hidden active:scale-90 transition-transform cursor-pointer"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay Drawer (Stunning iOS Safari Glassmorphic Drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#040406]/98 backdrop-blur-2xl transition-all animate-in slide-in-from-top duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          <div className="px-5 pt-4 pb-6 space-y-2.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-zinc-400"}`}>
                    <Icon size={18} />
                  </div>
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAuthenticated && (
              <div className="pt-3 border-t border-white/10 mt-3">
                <button
                  onClick={() => {
                    signOut({ callbackUrl: `${window.location.origin}/login` });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all shadow-inner"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}