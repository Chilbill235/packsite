"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
        animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0], opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        className="p-7 rounded-3xl bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-amber-500/10 border border-amber-500/50 shadow-[0_0_100px_rgba(245,158,11,0.4)] mb-6"
      >
        <Package size={72} className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <h2 className="font-black text-white text-2xl tracking-widest uppercase">
          DECRYPTING VAULT OS
        </h2>
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}