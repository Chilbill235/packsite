"use client";

import { useEffect, useState } from "react";

type WatchAdModalProps = {
  open: boolean;
  duration?: number;
  onFinished: () => void;
  onClose: () => void;
};

export default function WatchAdModal({
  open,
  duration = 30,
  onFinished,
  onClose,
}: WatchAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) return;

    setSecondsLeft(duration);
    setProgress(100);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;

        setProgress((next / duration) * 100);

        if (next <= 0) {
          clearInterval(interval);

          setTimeout(() => {
            onFinished();
          }, 500);

          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, duration, onFinished]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 p-8 shadow-2xl">

        <h2 className="text-3xl font-black text-center text-white">
          🎬 Rewarded Ad
        </h2>

        <p className="text-center text-zinc-400 mt-3">
          Your reward will be added when the ad finishes.
        </p>

        {/* Fake Ad */}
        <div className="mt-8 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-800">

          <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">

            <div className="text-center px-6">

              <div className="text-6xl mb-4">
                📦
              </div>

              <h3 className="text-2xl font-bold">
                Amazing Pack Sale!
              </h3>

              <p className="text-zinc-400 mt-2">
                Unlock legendary drops today.
              </p>

            </div>

          </div>

        </div>

        <div className="mt-6">

          <div className="flex justify-between mb-2 text-sm text-zinc-400">
            <span>Advertisement</span>
            <span>{secondsLeft}s</span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-1000"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>

        <div className="mt-8 flex justify-center">

          <button
            disabled={secondsLeft > 0}
            onClick={onClose}
            className={`px-8 py-3 rounded-xl font-bold transition ${
              secondsLeft > 0
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            {secondsLeft > 0
              ? `Please wait... ${secondsLeft}s`
              : "Continue"}
          </button>

        </div>

      </div>
    </div>
  );
}