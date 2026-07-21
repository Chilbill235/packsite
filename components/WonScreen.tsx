"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Coins, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const RARITY_THEMES: Record<
  string,
  { gradient: string; border: string; text: string; bg: string; glow: string }
> = {
  common: { gradient: "from-slate-500/10 via-slate-500/5 to-transparent", border: "border-slate-500/20 hover:border-slate-500/50", text: "text-slate-400", bg: "bg-slate-500/10", glow: "shadow-slate-500/5" },
  uncommon: { gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent", border: "border-emerald-500/30 hover:border-emerald-500/60", text: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/10" },
  rare: { gradient: "from-blue-500/15 via-blue-500/5 to-transparent", border: "border-blue-500/30 hover:border-blue-500/60", text: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/10" },
  epic: { gradient: "from-purple-500/15 via-purple-500/5 to-transparent", border: "border-purple-500/30 hover:border-purple-500/60", text: "text-purple-400", bg: "bg-purple-500/10", glow: "shadow-purple-500/10" },
  legendary: { gradient: "from-amber-500/20 via-amber-500/5 to-transparent", border: "border-amber-500/40 hover:border-amber-500/70", text: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/15" },
  mythic: { gradient: "from-pink-500/20 via-pink-500/5 to-transparent", border: "border-pink-500/40 hover:border-pink-500/70", text: "text-pink-400", bg: "bg-pink-500/10", glow: "shadow-pink-500/15" },
  divine: { gradient: "from-yellow-400/20 via-yellow-400/5 to-transparent", border: "border-yellow-400/40 hover:border-yellow-400/70", text: "text-yellow-400", bg: "bg-yellow-400/10", glow: "shadow-yellow-400/15" },
  cosmic: { gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", border: "border-cyan-500/40 hover:border-cyan-500/70", text: "text-cyan-400", bg: "bg-cyan-500/10", glow: "shadow-cyan-500/15" },
  void: { gradient: "from-indigo-600/20 via-indigo-600/5 to-transparent", border: "border-indigo-500/40 hover:border-indigo-500/70", text: "text-indigo-400", bg: "bg-indigo-500/10", glow: "shadow-indigo-500/15" },
  omega: { gradient: "from-yellow-300/25 via-amber-500/10 to-transparent", border: "border-yellow-300/50 hover:border-yellow-300/80", text: "text-yellow-300", bg: "bg-yellow-300/10", glow: "shadow-yellow-300/20" },
};

interface WonItem {
  name: string;
  rarity?: string;
  value?: number;
}

interface WonScreenProps {
  items: WonItem[];
  onClose: () => void;
  newBalance?: number;
}

const ITEMS_PER_PAGE = 9;

export default function WonScreen({ items, onClose }: WonScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!items || items.length === 0) return null;

  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const paginatedItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Helper to dynamically adjust grid columns depending on how many items are currently displayed
  const getDynamicGridConfig = (count: number) => {
    if (count === 1) return { grid: "grid-cols-1 max-w-xs mx-auto", minH: "min-h-[160px]" };
    if (count === 2) return { grid: "grid-cols-2 max-w-md mx-auto", minH: "min-h-[180px]" };
    if (count <= 4) return { grid: "grid-cols-2 max-w-lg mx-auto", minH: "min-h-[260px]" };
    // Default 3 column layout for 5-9 items
    return { grid: "grid-cols-3 max-w-full", minH: "min-h-[320px]" };
  };

  const layoutConfig = getDynamicGridConfig(paginatedItems.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Top Right Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-5 right-5 z-50 flex items-center justify-center w-10 h-10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-700/50 backdrop-blur-sm transition-all active:scale-95"
      >
        <X size={18} />
      </button>

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0c0d12] p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Title */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/80">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 flex-shrink-0">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide text-white uppercase leading-tight">
              Rewards Secured
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Items added to your inventory
            </p>
          </div>
        </div>

        {/* Summary Stat Cards - Perfectly Balanced Flex Layout */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Total Value Card */}
          <div className="flex items-center gap-3 px-3.5 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
              <Coins size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] text-zinc-500 uppercase font-black tracking-wider leading-none">
                Total Value
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400 truncate block mt-1 leading-none">
                +{totalValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Items Won Card */}
          <div className="flex items-center gap-3 px-3.5 py-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] text-zinc-500 uppercase font-black tracking-wider leading-none">
                Items Won
              </span>
              <span className="text-sm sm:text-base font-black text-white truncate block mt-1 leading-none">
                {items.length}
              </span>
            </div>
          </div>
        </div>

        {/* Items Grid Area - Dynamically Adapts and Centered */}
        <div className={`mt-4 ${layoutConfig.minH} flex flex-col justify-center`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-wrap justify-center gap-2.5 w-full`}
            >
              {paginatedItems.map((item, idx) => {
                const r = (item.rarity || "common").toLowerCase();
                const theme = RARITY_THEMES[r] || RARITY_THEMES.common;

                return (
                  <motion.div
                    key={`${currentPage}-${idx}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.025, duration: 0.2 }}
                    className={`group relative flex flex-col justify-between items-center text-center p-3 rounded-xl border bg-zinc-900/40 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:scale-[1.02] shadow-lg ${theme.border} ${theme.glow}
                      ${
                        /* Flex basis logic ensures 3 cards per row when 5+ items, but centers cleanly on the bottom row */
                        paginatedItems.length <= 4
                          ? "w-[calc(50%-0.35rem)]"
                          : "w-[calc(33.333%-0.45rem)]"
                      }
                    `}
                  >
                    {/* Radial Ambient Glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} opacity-40 group-hover:opacity-70 transition-opacity duration-300`}
                    />

                    {/* Rarity & Name */}
                    <div className="w-full relative z-10 flex flex-col items-center">
                      <span
                        className={`text-[9px] font-extrabold tracking-widest uppercase block mb-1 truncate max-w-full ${theme.text}`}
                      >
                        {item.rarity || "COMMON"}
                      </span>
                      <p className="text-xs font-bold text-zinc-100 line-clamp-2 leading-tight px-1 w-full">
                        {item.name}
                      </p>
                    </div>

                    {/* Price Badge */}
                    <div className="w-full mt-3 relative z-10 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-black/60 border border-white/5 text-[11px] font-black text-amber-400 shadow-inner">
                      <span>{(item.value || 0).toLocaleString()}</span>
                      <span className="text-[10px]">🪙</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions & Pagination Controls */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          {totalPages > 1 ? (
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-zinc-400 px-2">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
          >
            Confirm Collection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}