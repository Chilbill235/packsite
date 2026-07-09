"use client";

import { useEffect } from "react";

interface ErrorDialogProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorDialog({ message, onClose, onRetry }: ErrorDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="alertdialog" aria-modal="true">
      <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-3">Oops! Something went wrong</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-amber-500 hover:bg-amber-400 text-black font-medium py-1 px-3 rounded"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
