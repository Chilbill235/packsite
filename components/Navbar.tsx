"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, LogOut, Store, User } from "lucide-react";
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
    { name: "Shop", href: "/shop", icon: Store },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#070707]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link 
              href="/shop" 
              className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 bg-clip-text text-transparent tracking-tight hover:opacity-90 transition-opacity"
            >
              PACKSITE
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} />
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
                  className="hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-xl"
                  title="Earn Balance / Watch Ads"
                >
                  <Balance amount={balance} className="text-xs sm:text-sm font-bold" />
                </button>

                {/* Desktop Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 focus:outline-none md:hidden"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110 transition-all shadow-md shadow-amber-500/10"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#070707]/95 backdrop-blur-xl transition-all">
          <div className="px-4 pt-3 pb-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAuthenticated && (
              <div className="pt-2 border-t border-white/10 mt-2">
                <button
                  onClick={() => {
                    signOut({ callbackUrl: `${window.location.origin}/login` });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-98 transition-all"
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