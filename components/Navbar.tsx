"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";
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

  // Centralized balance sync: hook listens to global balanceUpdated events
  useBalanceSync((newBalance) => setBalance(newBalance));

  // Initial fetch on auth state change; hook picks up subsequent updates
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
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Re-sync whenever the user returns to the tab
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
    { name: "Shop", href: "/shop" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tighter">
            PACKSITE
          </Link>
        </div>

        <div className="hidden md:flex md:items-center md:space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${pathname === link.href ? "bg-amber-600/20 text-amber-400" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* FIXED: Clicking this fires a custom global event to open your balance/ad modal */}
              <button
                onClick={() => window.dispatchEvent(new Event("openShopBalanceModal"))}
                className="hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg"
                title="Earn Balance / Watch Ads"
              >
                <Balance amount={balance} className="text-sm" />
              </button>

              {/* Desktop Log Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                className="hidden md:flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all"
                aria-label="Log out"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white/5">Sign In</Link>
              <Link href="/register" className="px-3 py-2 rounded-md text-sm font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300 transition-all">Register</Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-amber-900/50 hover:bg-amber-900/70 hover:text-amber-300">
                {link.name}
              </Link>
            ))}
          </div>
          <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6 border-t border-gray-700">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  signOut({ callbackUrl: `${window.location.origin}/login` });
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-200 hover:bg-red-900/20"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-white bg-amber-600/20">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}