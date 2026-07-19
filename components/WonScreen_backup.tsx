"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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

const getRarityStyles = (rarity?: string) => {
  const r = rarity?.toLowerCase() || "common";
  if (r.includes("legend") || r.includes("mythic") || r.includes("omega")) {
    return { 
      bg: "bg-yellow-500/10", 
      border: "border-yellow-400", 
      text: "text-yellow-400", 
      glow: "from-yellow-400/40", 
      shadow: "shadow-[0_0_40px_rgba(250,204,21,0.4)]",
      emoji: "✨"
    };
  }
  if (r.includes("epic") || r.includes("void")) {
    return { 
      bg: "bg-purple-500/10", 
      border: "border-purple-400", 
      text: "text-purple-400", 
      glow: "from-purple-500/40", 
      shadow: "shadow-[0_0_40px_rgba(168,85,247,0.4)]",
      emoji: "🌟"
    };
  }
  if (r.includes("rare") || r.includes("galactic")) {
    return { 
      bg: "bg-blue-500/10", 
      border: "border-blue-400", 
      text: "text-blue-400", 
      glow: "from-blue-500/40", 
      shadow: "shadow-[0_0_40px_rgba(59,130,246,0.4)]",
      emoji: "💎"
    };
  }
  return { 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-400", 
    text: "text-emerald-400", 
    glow: "from-emerald-400/20", 
    shadow: "shadow-xl",
    emoji: "🪙"
  };
};

const getResponsiveGridCols = (count: number): number => {
  if (count <= 1) return 1;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
};

export default function WonScreen({ items, onClose, totalValue }: WonScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const gridCols = getResponsiveGridCols(items.length);

  // Responsive sizing based on item count and screen size
  const getItemSizeClass = (): string => {
    if (items.length <= 3) {
      return "min-h-[100px] sm:min-h-[120px] p-3 sm:p-4";
    }
    if (items.length <= 6) {
      return "min-h-[80px] sm:min-h-[90px] p-2 sm:p-2.5";
    }
    if (items.length <= 12) {
      return "min-h-[65px] sm:min-h-[75px] p-1.5 sm:p-2";
    }
    return "min-h-[55px] sm:min-h-[65px] p-1";
  };

  const getTextSizeClass = (): string => {
    if (items.length <= 3) {
      return "text-xs sm:text-sm";
    }
    if (items.length <= 6) {
      return "text-[10px] sm:text-xs";
    }
    if (items.length <= 12) {
      return "text-[9px] sm:text-[10px]";
    }
    return "text-[8px] sm:text-[9px]";
  };

  const getMaxHeight = (): string => {
    if (items.length <= 3) return "max-h-[60vh]";
    if (items.length <= 6) return "max-h-[55vh]";
    if (items.length <= 12) return "max-h-[50vh]";
    return "max-h-[45vh]";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-3 sm:p-4 md:p-6 pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 280, damping: 25 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center py-4 sm:py-6 md:py-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow effect */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          className="absolute w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-gradient-to-r from-yellow-500/30 via-purple-500/20 to-blue-500/30 blur-[120px] rounded-full pointer-events-none"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2.5 sm:p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
          aria-label="Close"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 text-center mb-4 sm:mb-6"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/40 uppercase tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            You Won!
          </h2>
          {totalValue !== undefined && totalValue > 0 && (
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl font-black text-yellow-400 mt-2"
            >
              +{totalValue.toLocaleString()} Coins
            </motion.p>
          )}
          <p className="text-xs sm:text-sm text-white/60 mt-1 font-medium">
            {items.length} {items.length === 1 ? "Reward" : "Rewards"} Unlocked
          </p>
        </motion.div>

        {/* Items grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={grid w-full gap-2 sm:gap-3 px-2 sm:px-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-  overflow-y-auto pr-1 sm:pr-2}
        >
          <AnimatePresence>
            {items.map((item, idx) => {
              const theme = getRarityStyles(item.rarity);
              const sizeClass = getItemSizeClass();
              const textSizeClass = getTextSizeClass();
              
              return (
                <motion.div
                  key={idx}
                  initial={{ rotateX: -90, opacity: 0, y: 20 }}
                  animate={{ rotateX: 0, opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    delay: idx * 0.08, 
                    type: "spring", 
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  className={group relative min-w-0  border  backdrop-blur-xl  flex flex-col items-center text-center rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden }
                >
                  <div className={bsolute inset-0 bg-gradient-to-br  opacity-30 group-hover:opacity-50 transition-opacity duration-500} />
                  
                  <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
                    <span className={${textSizeClass} font-black uppercase tracking-wider  mb-1.5 sm:mb-2 line-clamp-1}>
                      {theme.emoji} {item.rarity || "COMMON"}
                    </span>
                    <p className={${textSizeClass} font-extrabold leading-tight text-white mb-2 line-clamp-2 break-words px-1}>
                      {item.name}
                    </p>
                    {item.value !== undefined && (
                      <div className="mt-auto max-w-full px-2 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-white font-bold tracking-normal truncate text-[10px] sm:text-xs">
                        {item.value.toLocaleString()} coins
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Collect button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="relative z-10 mt-4 sm:mt-6 px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm sm:text-lg rounded-xl sm:rounded-2xl transition-all hover:from-amber-400 hover:to-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
        >
          COLLECT REWARDS
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
