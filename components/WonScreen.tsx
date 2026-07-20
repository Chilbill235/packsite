"use client";

import { motion } from "framer-motion";
import { X, Package, Coins, Sparkles } from "lucide-react";

const RARITY_THEMES: Record<
  string,
  { gradient: string; border: string; text: string; bg: string; glow: string; }
> = {
  common: { gradient: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/30", text: "text-gray-400", bg: "bg-gray-500/10", glow: "from-gray-500/30 to-transparent" },
  uncommon: { gradient: "from-green-500/20 to-green-600/20", border: "border-green-500/30", text: "text-green-400", bg: "bg-green-500/10", glow: "from-green-500/30 to-transparent" },
  rare: { gradient: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500/10", glow: "from-blue-500/30 to-transparent" },
  epic: { gradient: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/30", text: "text-purple-400", bg: "bg-purple-500/10", glow: "from-purple-500/30 to-transparent" },
  legendary: { gradient: "from-orange-500/20 to-orange-600/20", border: "border-orange-500/30", text: "text-orange-400", bg: "bg-orange-500/10", glow: "from-orange-500/30 to-transparent" },
  mythic: { gradient: "from-pink-500/20 to-pink-600/20", border: "border-pink-500/30", text: "text-pink-400", bg: "bg-pink-500/10", glow: "from-pink-500/30 to-transparent" },
  divine: { gradient: "from-yellow-500/20 to-yellow-600/20", border: "border-yellow-500/30", text: "text-yellow-400", bg: "bg-yellow-500/10", glow: "from-yellow-500/30 to-transparent" },
  cosmic: { gradient: "from-cyan-500/20 to-cyan-600/20", border: "border-cyan-500/30", text: "text-cyan-400", bg: "bg-cyan-500/10", glow: "from-cyan-500/30 to-transparent" },
  void: { gradient: "from-purple-600/20 to-purple-800/20", border: "border-purple-500/30", text: "text-purple-400", bg: "bg-purple-500/10", glow: "from-purple-600/30 to-transparent" },
  omega: { gradient: "from-yellow-400/20 to-yellow-600/20", border: "border-yellow-400/30", text: "text-yellow-400", bg: "bg-yellow-500/10", glow: "from-yellow-400/30 to-transparent" },
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

export default function WonScreen({ items, onClose, newBalance }: WonScreenProps) {
  if (!items || items.length === 0) return null;

  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);

  // Dynamically assigns base layout sizes depending on how many total items exist
  const getResponsiveGridClasses = (count: number) => {
    if (count <= 2) return "grid-cols-1 sm:grid-cols-2 max-w-md mx-auto";
    if (count <= 4) return "grid-cols-2 sm:grid-cols-4 max-w-2xl mx-auto";
    // Defaults to highly responsive auto-wrapping grid structure up to 7 columns across on large monitors
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="won-screen-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-4 right-4 z-50 p-3 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="won-screen-container w-full max-w-6xl rounded-2xl border border-zinc-800 bg-[#0b0d11] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="won-screen-header flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Package className="text-amber-400" size={22} />
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase tracking-wider">
            Rewards Secured
          </h2>
        </div>

        {/* Summary Stats Cards */}
        <div className="won-screen-summary mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="summary-card flex items-center gap-3 px-4 py-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl">
            <Coins className="text-amber-400 flex-shrink-0" size={18} />
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Total Value</p>
              <p className="text-sm sm:text-base font-black text-amber-400">+{totalValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card flex items-center gap-3 px-4 py-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl">
            <Sparkles className="text-cyan-400 flex-shrink-0" size={18} />
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Items Won</p>
              <p className="text-sm sm:text-base font-black text-white">{items.length}</p>
            </div>
          </div>
        </div>

        {/* Scrollable View Containment Area */}
        <div className="mt-5 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
          <div className={`grid gap-2.5 ${getResponsiveGridClasses(items.length)}`}>
            {items.map((item, idx) => {
              const r = (item.rarity || "common").toLowerCase();
              const theme = RARITY_THEMES[r] || RARITY_THEMES.common;
              return (
                <motion.div
                  key={idx}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.8) }}
                  className={`flex flex-col justify-between items-center text-center p-3 rounded-xl border bg-zinc-900/20 group relative overflow-hidden transition-all duration-200 hover:bg-zinc-900/40 ${theme.border}`}
                >
                  {/* Background overlay gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10 group-hover:opacity-25 transition-opacity duration-300`} />
                  
                  <div className="w-full">
                    {/* Rarity Tag */}
                    <span className={`text-[9px] font-black tracking-widest uppercase block mb-1 ${theme.text}`}>
                      {item.rarity || "COMMON"}
                    </span>
                    {/* Item Name */}
                    <p className="text-xs font-bold text-zinc-200 truncate w-full px-0.5">
                      {item.name}
                    </p>
                  </div>

                  {/* Pricing Badge Layout */}
                  <div className="w-full mt-3 z-10 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-black/40 border border-white/[0.03] text-[11px] font-black text-amber-400">
                    <span>{item.value?.toLocaleString() || 0}</span>
                    <span className="text-[10px]">🪙</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer Fixed Actions */}
        <div className="won-screen-footer mt-5 pt-4 border-t border-zinc-800/80 flex justify-center flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full max-w-xs py-3.5 bg-white hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] shadow-xl"
          >
            Confirm Collection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}