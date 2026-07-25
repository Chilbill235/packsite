"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { 
  Package, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Flame,
  Crown,
  Lock,
  ChevronRight,
  Gift
} from "lucide-react";

// --- High-Performance Optimized Particle Field ---
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      vy: -(Math.random() * 0.35 + 0.1),
      vx: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.4 ? "#f59e0b" : "#ec4899",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0 || p.x > width) {
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-70" />;
}

export default function HomePage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // 3D Mouse Parallax Effect for Desktop
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-400, 400], [8, -8]), { stiffness: 120, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-8, 8]), { stiffness: 120, damping: 25 });

  useEffect(() => {
    setIsMounted(true);
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";

    const savedPreference = localStorage.getItem("vault_root_preference");
    if (savedPreference === "shop") {
      router.replace("/shop");
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX - innerWidth / 2);
      mouseY.set(e.clientY - innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, router]);

  // Cinematic Loading Sequence Simulator
  useEffect(() => {
    if (!isNavigating) {
      setLoadingProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 30);

    const timer = setTimeout(() => {
      router.push("/shop");
    }, 1100);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isNavigating, router]);

  const handleEnterShop = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen bg-[#030305] text-white font-sans flex flex-col justify-between selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* Background Enhancements */}
      <ParticleCanvas />
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none z-0" />

      {/* Radiant Glowing Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-amber-500/20 via-orange-500/5 to-transparent blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[25%] left-[-100px] w-[500px] h-[500px] bg-indigo-600/10 blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[600px] h-[600px] bg-fuchsia-600/10 blur-[180px] rounded-full pointer-events-none z-0" />

      {/* HEADER / FLOATING NAVIGATION BAR */}
      <motion.header 
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 flex items-center justify-between px-6 sm:px-12 py-6 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={handleEnterShop}>
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform duration-300">
            <Package size={22} className="stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-widest text-xl sm:text-2xl bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent leading-none drop-shadow-sm">
              PACKSITE
            </span>
            <span className="text-[10px] font-extrabold text-amber-400/90 tracking-widest uppercase mt-1">VAULT OS v2.4</span>
          </div>
        </div>

        {/* Clean Action Launch Control */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEnterShop}
            className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>LAUNCH VAULT</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-6xl mx-auto w-full py-10 sm:py-16">
        
        {/* Status Pill */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.25)] mb-8 backdrop-blur-xl"
        >
          <Flame size={14} className="animate-pulse text-amber-400" />
          <span>CYBER VAULTS ACTIVE • 100% PROVABLY FAIR</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] uppercase max-w-5xl"
        >
          OPEN THE NEXT <br />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            GEN VAULTS
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed font-medium px-2"
        >
          Unbox mythic gear, supercharge drop multipliers, and claim exclusive daily rewards on the most interactive unboxing platform.
        </motion.p>

        {/* Main CTA Button */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex items-center justify-center w-full"
        >
          <button 
            onClick={handleEnterShop}
            className="group relative px-10 sm:px-12 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_0_50px_rgba(245,158,11,0.45)] hover:shadow-[0_0_85px_rgba(245,158,11,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3.5 overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Sparkles size={20} className="relative z-10 text-black animate-spin-slow" />
            <span className="relative z-10">ENTER VAULT SHOP</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>

        {/* 3D INTERACTIVE HERO CARD SHOWCASE */}
        <motion.div 
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={handleEnterShop}
          className="mt-16 sm:mt-20 relative w-full max-w-4xl cursor-pointer group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-fuchsia-500/10 to-indigo-500/20 blur-3xl rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-[#08080a] border border-white/10 group-hover:border-amber-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all duration-500">
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
              <div className="flex items-center gap-2.5">
                <Crown size={18} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">FEATURED DROPS</span>
              </div>
              <span className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 shadow-inner">LIVE MULTIPLIERS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/30 to-transparent border border-amber-500/20 flex flex-col items-center group/card hover:border-amber-400 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3.5 group-hover/card:scale-110 transition-transform">
                  <Package size={30} className="text-amber-400" />
                </div>
                <span className="text-xs font-black text-amber-300 tracking-wider">APEX MATRIX</span>
                <span className="text-[10px] font-bold text-slate-400 mt-1">500 COINS</span>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-fuchsia-950/30 to-transparent border border-fuchsia-500/20 flex flex-col items-center group/card hover:border-fuchsia-400 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-3.5 group-hover/card:scale-110 transition-transform">
                  <Crown size={30} className="text-fuchsia-400" />
                </div>
                <span className="text-xs font-black text-fuchsia-300 tracking-wider">OMEGA OVERLORD</span>
                <span className="text-[10px] font-bold text-slate-400 mt-1">5,000 COINS</span>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-transparent border border-indigo-500/20 flex flex-col items-center group/card hover:border-indigo-400 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3.5 group-hover/card:scale-110 transition-transform">
                  <Lock size={30} className="text-indigo-400" />
                </div>
                <span className="text-xs font-black text-indigo-300 tracking-wider">CLASSIFIED VAULT</span>
                <span className="text-[10px] font-bold text-indigo-400 mt-1">UNLOCKABLE</span>
              </div>

            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2"><Gift size={15} className="text-amber-400" /> Free Daily Box Included</span>
              <span className="font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Quick Open <ChevronRight size={15} /></span>
            </div>
          </div>
        </motion.div>

        {/* FEATURE HIGHLIGHTS GRID */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-14 sm:mt-20 w-full"
        >
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center text-center hover:border-amber-500/40 hover:bg-white/[0.05] transition-all group">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Zap size={24} />
            </div>
            <h3 className="font-black text-white text-sm tracking-wide">Instant Multipliers</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">Stack up to 3x Luck and 20% discounts directly onto your balance.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center text-center hover:border-amber-500/40 hover:bg-white/[0.05] transition-all group">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Package size={24} />
            </div>
            <h3 className="font-black text-white text-sm tracking-wide">Provably Fair Drops</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">Cryptographically verified unboxing odds across all active vaults.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center text-center hover:border-amber-500/40 hover:bg-white/[0.05] transition-all group">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-black text-white text-sm tracking-wide">PWA Optimized</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">Seamless experience on PC, Android, and standalone iOS Safari PWA.</p>
          </div>
        </motion.div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 p-8 text-center text-slate-500 text-xs border-t border-white/5 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Package size={16} className="text-amber-500" />
          <span className="font-extrabold text-slate-300">PACKSITE</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 text-slate-400 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={handleEnterShop}>Shop</span>
          <span className="hover:text-white cursor-pointer transition-colors" onClick={handleEnterShop}>Vaults</span>
          <span className="hover:text-white cursor-pointer transition-colors" onClick={handleEnterShop}>Terms</span>
        </div>
      </footer>

      {/* BREATHTAKING CYBERPUNK VAULT DECRYPTION LOADING OVERLAY */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[300] bg-[#020204]/95 backdrop-blur-2xl flex flex-col items-center justify-center pointer-events-auto overflow-hidden"
          >
            {/* Glowing Scanning Grid Backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Rotating Cyber Rings */}
            <div className="relative mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute w-36 h-36 rounded-full border border-dashed border-amber-500/40"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-28 h-28 rounded-full border border-fuchsia-500/30"
              />

              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 p-6 rounded-3xl bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-500/10 border border-amber-500/60 shadow-[0_0_80px_rgba(245,158,11,0.5)]"
              >
                <Package size={56} className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-pulse" />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 relative z-10 w-full max-w-xs px-4"
            >
              <div className="flex items-center justify-between w-full text-xs font-black tracking-widest uppercase">
                <span className="text-amber-400 animate-pulse">DECRYPTING VAULT OS</span>
                <span className="text-slate-400">{loadingProgress}%</span>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10 p-0.5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">ESTABLISHING SECURE CONNECTION</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}