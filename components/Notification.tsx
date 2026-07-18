"use client";

import { useEffect } from "react";

interface NotificationProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Notification({ message, type = "success", onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === "error" ? "bg-rose-600" : "bg-emerald-600";
  const icon = type === "error" ? "⚠️" : "✅";

  return (
    <div className={`fixed top-4 right-4 max-w-xs w-full bg-white ${bg} text-white px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2`}>
      <span>{icon}</span>
      <span className="flex-1">{message}</span>
    </div>
  );
}