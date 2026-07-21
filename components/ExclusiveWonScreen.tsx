"use client";

import { motion } from "framer-motion";
import { X, Crown, Diamond } from "lucide-react";

interface WonItem {
  name: string;
  rarity?: string;
  value?: number;
}

interface ExclusiveWonScreenProps {
  items: WonItem[];
  onClose: () => void;
  newBalance?: number;
}

const RARITY_GLOW: Record<string, { border: string; text: string; glow: string; bg: string }> = {
  legendary: { border: "border-orange-400", text: "text-orange-300", glow: "from-orange-400 via-amber-300 to-yellow-200", bg: "bg-orange-900/30" },
  mythic: { border: "border-pink-500", text: "text-pink-300", glow: "from-pink-500 via-purple-400 to-fuchsia-300", bg: "bg-pink-900/30" },
  omega: { border: "border-yellow-400", text: "text-yellow-300", glow: "from-yellow-300 via-amber-200 to-white", bg: "bg-yellow-900/30" },
  default: { border: "border-indigo-400", text: "text-indigo-300", glow: "from-indigo-400 via-purple-300 to-fuchsia-200", bg: "bg-indigo-900/30" },
};

function getTheme(rarity?: string) {
  const key = (rarity || "default").toLowerCase();
  return RARITY_GLOW[key] || RARITY_GLOW.default;
}

export default function ExclusiveWonScreen({ items, onClose, newBalance }: ExclusiveWonScreenProps) {
  if (!items || items.length === 0) return null;
  const primaryItem = items[0];
  const theme = getTheme(primaryItem.rarity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Particle burst */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
            initial={{ x: "50vw", y: "50vh", scale: 0, opacity: 1 }}
            animate={{ x: `${20 + Math.random() * 60}vw`, y: `${10 + Math.random() * 80}vh`, scale: 0, opacity: 0 }}
            transition={{ duration: 1.5 + Math.random() * 2, delay: 0.3 + Math.random() * 0.5, ease: "easeOut" }}
          />
        ))}
      </div>

      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-4 right-4 z-[310] p-3 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/10">
        <X size={22} />
      </button>

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-400 shadow-[0_0_60px_rgba(168,85,247,0.3)]">
          <div className="rounded-3xl bg-[#0a0a0f] p-6 sm:p-8 relative overflow-hidden">
            {/* Inner glow */}
            <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br ${theme.glow} blur-3xl opacity-20 pointer-events-none`} />

            {/* Crown badge */}
            <motion.div
              initial={{ y: -20, opacity: 0, rotate: -10 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full" />
                <Crown className="text-amber-400 relative z-10" size={48} strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight"
            >⚡ VAULT UNLOCKED! ⚡</motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-xs text-zinc-400 mb-6 font-light"
            >You&apos;ve claimed an exclusive premium drop</motion.p>
            {/* Item reveal card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 180 }}
              className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 mb-5 text-center relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.glow} opacity-5`} />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="relative z-10"
              >
                <Diamond className="mx-auto mb-3 text-amber-300" size={40} strokeWidth={1.5} />
              </motion.div>
              <span className={`text-[10px] font-black tracking-[0.25em] uppercase block mb-2 ${theme.text} relative z-10`}>
                {primaryItem.rarity || "EXCLUSIVE"}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3 relative z-10">{primaryItem.name}</h3>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 relative z-10">
                <span className="text-lg">🪙</span>
                <span className="text-sm font-black text-amber-400">+{primaryItem.value?.toLocaleString() || 0}</span>
              </div>
            </motion.div>

            {/* Additional items */}
            {items.length > 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mb-5">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2 text-center">Bonus Drops</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.slice(1).map((item, idx) => {
                    const t = getTheme(item.rarity);
                    return (
                      <motion.div key={idx}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.3 + idx * 0.08 }}
                        className={`rounded-xl border ${t.border} ${t.bg} p-2.5 text-center`}
                      >
                        <span className={`text-[8px] font-black tracking-wider uppercase block ${t.text}`}>{item.rarity || "ITEM"}</span>
                        <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                        <span className="text-[10px] font-bold text-amber-400">+{item.value?.toLocaleString() || 0}🪙</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* New balance */}
            {newBalance !== undefined && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} className="text-center mb-4">
                <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">New Balance</p>
                <p className="text-base font-black text-amber-400">{newBalance.toLocaleString()} 🪙</p>
              </motion.div>
            )}

            {/* Confirm button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="text-center">
              <button onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-400 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all active:scale-[0.97] shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                Collect Premium Reward
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
