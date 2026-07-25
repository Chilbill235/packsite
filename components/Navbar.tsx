"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll } from "framer-motion";
import { Menu, X, LogOut, Store, User, Home, Sparkles, Zap, ShieldAlert, Trophy } from "lucide-react";
import { useBalanceSync } from "@/hooks/useBalanceSync";
import Balance from "./Balance";
import { useProgression } from "@/context/ProgressionContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const [balance, setBalance] = useState<number>(0);
  const { accountLevel, xp, nextLevelXp } = useProgression();
  const [scrolled, setScrolled] = useState(false);

  // Advanced mouse coordinates for holographic spotlight tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const navRef = useRef<HTMLElement>(null);

  // Smooth springs for mouse interaction
  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  // Scroll position mapping for dynamic border intensity & blur
  const { scrollY } = useScroll();
  
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setScrolled(latest > 15);
    });
  }, [scrollY]);

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

  // Mouse tracker for lighting effect
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: Store },
    { name: "Profile", href: "/profile", icon: User },
  ];

  // Calculate XP percentage for mini progression bar if available
  const xpPercent = xp && nextLevelXp ? Math.min(100, Math.max(0, (xp / nextLevelXp) * 100)) : 0;

  return (
    <motion.nav 
      ref={navRef}
      onMouseMove={handleMouseMove}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-[#020204]/92 backdrop-blur-3xl border-b border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)]" 
          : "bg-[#030306]/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Interactive Cyberpunk Mouse Light Spotlight */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen overflow-hidden"
        style={{
          background: `radial-gradient(500px circle at ${smoothX}px ${smoothY}px, rgba(245, 158, 11, 0.12), transparent 70%)`
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand with Micro Progression Ring & Hologram Effect */}
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="group flex items-center gap-3 text-2xl font-black tracking-tight"
            >
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.6)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Sparkles size={18} className="fill-black animate-spin" style={{ animationDuration: "12s" }} />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-black"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent tracking-wider drop-shadow-md">
                  PACKSITE
                </span>
                {accountLevel && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-amber-400/90 tracking-widest uppercase flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                      <Trophy size={9} className="text-amber-400" /> LVL {accountLevel}
                    </span>
                    {/* Micro XP Bar */}
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links with Magnetic Pills */}
          <div className="hidden md:flex items-center space-x-2 bg-black/40 border border-white/10 p-1.5 rounded-2xl backdrop-blur-2xl shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 group overflow-hidden ${
                    isActive
                      ? "text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavbarPill"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/30 border border-amber-500/50 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={16} className={`relative z-10 transition-transform group-hover:scale-110 ${isActive ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "text-zinc-400"}`} />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop & Mobile Actions Matrix */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Advanced Live Balance Trigger with Pulse Effect */}
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => window.dispatchEvent(new Event("openShopBalanceModal"))}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/20 to-amber-500/10 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)] cursor-pointer flex items-center gap-2 backdrop-blur-2xl"
                  title="Earn Balance / Watch Ads"
                >
                  <Balance amount={balance} className="text-xs sm:text-sm font-black text-amber-300 tracking-wide drop-shadow-sm" />
                </motion.button>

                {/* Desktop Secure Logout */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer shadow-inner"
                  aria-label="Log out"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </motion.button>

                {/* Mobile & iOS Hamburger Toggle */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-3 rounded-2xl bg-white/[0.06] border border-white/15 text-zinc-300 hover:text-white hover:bg-white/20 focus:outline-none md:hidden transition-all cursor-pointer shadow-xl"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5 text-amber-400 rotate-90 transition-transform" /> : <Menu className="h-5 w-5" />}
                </motion.button>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link 
                  href="/login" 
                  className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black hover:brightness-110 transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* iOS Safari Optimized Glassmorphic Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-amber-500/30 bg-[#020204]/98 backdrop-blur-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
          >
            <div className="px-6 pt-6 pb-8 space-y-3.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/15 text-amber-300 border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white border border-white/5"
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isActive ? "bg-amber-500/20 text-amber-400 shadow-inner" : "bg-white/5 text-zinc-400"}`}>
                      <Icon size={20} />
                    </div>
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {isAuthenticated && (
                <div className="pt-4 border-t border-white/10 mt-4">
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: `${window.location.origin}/login` });
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 active:scale-95 transition-all shadow-inner"
                  >
                    <LogOut size={18} />
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}