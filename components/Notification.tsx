"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Notification({
  message,
  type = "success",
  onClose,
}: NotificationProps) {
  // Prevent multiple rapid re-triggers
  const styles = {
    success: { bg: "bg-emerald-600", icon: "✅" },
    error: { bg: "bg-rose-600", icon: "❌" },
    info: { bg: "bg-blue-600", icon: "ℹ️" },
  };

  const { bg, icon } = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`fixed top-4 right-4 max-w-xs w-full text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${bg}`}
    >
      <span>{icon}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
