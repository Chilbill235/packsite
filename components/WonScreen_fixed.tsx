"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

const RARITY_THEMES: Record<
  string,
  { border: string; text: string; glow: string; }
> = {
  common: { border: "border-gray-500/30", text: "text-gray-300", glow: "from-gray-500/30 to-transparent" },
  uncommon: { border: "border-green-500/30", text: "text-green-300", glow: "from-green-500/30 to-transparent" },
  rare: { border: "border-blue-500/30", text: "text-blue-300", glow: "from-blue-500/30 to-transparent" },
  epic: { border: "border-purple-500/30", text: "text-purple-300", glow: "from-purple-500/30 to-transparent" },
  legendary: { border: "border-orange-500/30", text: "text-orange-300", glow: "from-orange-500/30 to-transparent" },
  mythic: { border: "border-pink-500/30", text: "text-pink-300", glow: "from-pink-500/30 to-transparent" },
  divine: { border: "border-yellow-500/30", text: "text-yellow-300", glow: "from-yellow-500/30 to-transparent" },
  cosmic: { border: "border-cyan-500/30", text: "text-cyan-300", glow: "from-cyan-500/30 to-transparent" },
  void: { border: "border-purple-500/30", text: "text-purple-400", glow: "from-purple-600/30 to-transparent" },
  omega: { border: "border-yellow-400/30", text: "text-yellow-400", glow: "from-yellow-400/30 to-transparent" },
};

interface WonItem {
  name: string;
  rarity?: string;
  value?: number;
}

interface WonScreenProps {
  items: WonItem[];
  onClose: () => void;
  totalValue?: number;
}

// Get responsive grid columns based on item count - ensures items always fit
const getGridCols = (count: number): number => {
  if (count <= 1) return 1;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  if (count <= 12) return 3;
  if (count <= 16) return 4;
  if (count <= 20) return 4;
  if (count <= 25) return 5;
  if (count <= 30) return 5;
  if (count <= 35) return 6;
  if (count <= 40) return 6;
  if (count <= 45) return 7;
  return 8;
};

export default function WonScreen({ items, onClose, totalValue }: WonScreenProps) {
  if (!items || items.length === 0) return null;

  const gridCols = getGridCols(items.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="won-screen-overlay"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50 p-3 sm:p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="won-screen-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="won-screen-header">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Rewards Secured
          </h2>
        </div>

        <div className="won-screen-summary">
          <div className="summary-card flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/60 rounded-xl">
            <span className="text-amber-400 text-lg">🪙</span>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Total Value</p>
              <p className="text-base font-black text-amber-400">
                +{totalValue !== undefined ? (totalValue || 0).toLocaleString() : items.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="summary-card flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/60 rounded-xl">
            <span className="text-cyan-400 text-lg">✨</span>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Items Won</p>
              <p className="text-base font-black text-white">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="won-screen-items custom-scrollbar">
          <div className={`won-grid item-count-${Math.min(items.length, 50)}`}>
            {items.map((item, idx) => {
              const r = (item.rarity || "common").toLowerCase();
              const theme = RARITY_THEMES[r] || RARITY_THEMES.common;
              return (
                <motion.div
                  key={idx}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.03, 1.5) }}
                  className={`won-card ${theme.border} group relative`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                  <span className={`won-card-rarity ${theme.text} relative z-10`}>
                    {item.rarity || "COMMON"}
                  </span>
                  <p className="won-card-text relative z-10 truncate max-w-full px-1">{item.name}</p>
                  <div className="won-card-value relative z-10 mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 text-white truncate max-w-full">
                    {item.value?.toLocaleString() || 0} 🪙
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="won-screen-footer">
          <button
            onClick={onClose}
            className="px-12 py-3.5 bg-white hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
          >
            Confirm Collection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
