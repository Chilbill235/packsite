"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Coins, Sparkles } from "lucide-react";
import Balance from "./Balance";

// Rarity themes for visual styling
const RARITY_THEMES: Record<string, { 
  gradient: string; 
  border: string; 
  text: string; 
  bg: string;
  glow: string;
}> = {
  common: {
    gradient: "from-gray-500/20 to-gray-600/20",
    border: "border-gray-500/30",
    text: "text-gray-300",
    bg: "bg-gray-500/10",
    glow: "from-gray-500/30 to-transparent"
  },
  uncommon: {
    gradient: "from-green-500/20 to-green-600/20",
    border: "border-green-500/30",
    text: "text-green-300",
    bg: "bg-green-500/10",
    glow: "from-green-500/30 to-transparent"
  },
  rare: {
    gradient: "from-blue-500/20 to-blue-600/20",
    border: "border-blue-500/30",
    text: "text-blue-300",
    bg: "bg-blue-500/10",
    glow: "from-blue-500/30 to-transparent"
  },
  epic: {
    gradient: "from-purple-500/20 to-purple-600/20",
    border: "border-purple-500/30",
    text: "text-purple-300",
    bg: "bg-purple-500/10",
    glow: "from-purple-500/30 to-transparent"
  },
  legendary: {
    gradient: "from-orange-500/20 to-orange-600/20",
    border: "border-orange-500/30",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    glow: "from-orange-500/30 to-transparent"
  },
  mythic: {
    gradient: "from-pink-500/20 to-pink-600/20",
    border: "border-pink-500/30",
    text: "text-pink-300",
    bg: "bg-pink-500/10",
    glow: "from-pink-500/30 to-transparent"
  },
  divine: {
    gradient: "from-yellow-500/20 to-yellow-600/20",
    border: "border-yellow-500/30",
    text: "text-yellow-300",
    bg: "bg-yellow-500/10",
    glow: "from-yellow-500/30 to-transparent"
  }
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

export default function WonScreen({ 
  items, 
  onClose,
  newBalance 
}: WonScreenProps) {
  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);

  const getGridCols = () => {
    if (items.length <= 0) return "grid-cols-1";
    if (items.length <= 3) return "grid-cols-1 sm:grid-cols-3";
    if (items.length <= 6) return "grid-cols-2 sm:grid-cols-3";
    if (items.length <= 12) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    if (items.length <= 20) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5";
    return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
  };

  const getTextSizeClass = () => {
    if (items.length <= 6) return "text-xs sm:text-sm";
    if (items.length <= 12) return "text-[10px] sm:text-xs";
    return "text-[9px] sm:text-[10px]";
  };

  const getValueTextSizeClass = () => {
    if (items.length <= 6) return "text-[10px] sm:text-xs";
    if (items.length <= 12) return "text-[9px] sm:text-[10px]";
    return "text-[8px] sm:text-[9px]";
  };

  const getTheme = (rarity?: string) => {
    const key = (rarity || "common").toLowerCase() as keyof typeof RARITY_THEMES;
    return RARITY_THEMES[key] || RARITY_THEMES.common;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-5xl max-h-[95vh] bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Package className="text-amber-500" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Congratulations!
              </h2>
            </div>
            
            <button
              onClick={onClose}
              aria-label="Close won screen"
              className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 transition-all group"
            >
              <X className="text-zinc-400 group-hover:text-white transition-colors" size={24} />
            </button>
          </div>

          <div className="relative z-10 p-4 sm:p-6 border-b border-zinc-800/50 bg-black/30">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-xl">
                <Coins className="text-amber-500" size={20} />
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">Total Value</p>
                  <p className="text-lg sm:text-xl font-black text-amber-400">{totalValue.toLocaleString()}</p>
                </div>
              </div>
              
              {newBalance !== undefined && (
                <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-xl">
                  <Sparkles className="text-amber-500" size={20} />
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">New Balance</p>
                    <Balance amount={newBalance} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Package className="text-zinc-600 mb-4" size={48} />
                <p className="text-zinc-500 text-center">No items to display</p>
              </div>
            ) : (
              <div className={`grid ${getGridCols()} gap-2 sm:gap-3 md:gap-4 auto-rows-fr`}>
                {items.map((item, idx) => {
                  const theme = getTheme(item.rarity);
                  
                  return (
                    <motion.div
                      key={`${item.name}-${idx}`}
                      initial={{ scale: 0, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        damping: 20,
                        delay: idx * 0.05
                      }}
                      whileHover={{ scale: 1.05, translateY: -4, transition: { type: "spring", stiffness: 400 } }}
                      className={`group relative aspect-square min-w-0 bg-black/40 border ${theme.border} backdrop-blur-xl rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-2 sm:p-3 overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                      <div className={`absolute inset-0 bg-gradient-to-t ${theme.glow} to-transparent pointer-events-none`} />
                      
                      <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mb-2">
                        <div className={`w-full h-full rounded-lg ${theme.bg} border ${theme.border} flex items-center justify-center`}>
                          <Package className={`${theme.text}`} size={20} />
                        </div>
                      </div>
                      
                      <p className={`relative z-10 font-extrabold ${getTextSizeClass()} text-white text-center line-clamp-2 mb-1 px-1`}>
                        {item.name}
                      </p>
                      
                      <span className={`relative z-10 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase ${theme.text} ${theme.bg} border ${theme.border} mb-1`}>
                        {item.rarity || "Common"}
                      </span>
                      
                      <span className={`relative z-10 px-2 py-0.5 rounded-full bg-white/5 text-white font-bold ${getValueTextSizeClass()} truncate`}>
                        {item.value?.toLocaleString() || 0} 🪙
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative z-10 p-4 sm:p-6 border-t border-zinc-800/50 bg-black/30">
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251, 191, 36, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={items.length === 0}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm sm:text-lg rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>COLLECT REWARDS</span>
                {items.length > 0 && (<Sparkles className="animate-pulse" size={20} />)}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}