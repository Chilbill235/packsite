"use client";

import { useState } from "react";
import type { PackWithItems, PackOpenResponse } from "@/types";
import Notification from "./Notification";
import ErrorDialog from "./ErrorDialog";

interface PackClientWrapperProps {
  pack: PackWithItems;
}

export default function PackClientWrapper({ pack }: PackClientWrapperProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<PackOpenResponse["wonItem"] | null>(null);
  const [notification, setNotification] = useState<{message:string,type?:"success"|"error"}|null>(null);
  const [errorDialog, setErrorDialog] = useState<{message:string, onRetry?: () => void} | null>(null);

  // Defensive check: If no pack data exists, render a fallback after hooks are initialized.
  if (!pack) return <div className="p-8 text-center text-white">Pack not found.</div>;

  const handlePurchase = async () => {
    setIsOpening(true);
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult(data.wonItem ?? data.wonItems?.[0] ?? null);
        window.dispatchEvent(new CustomEvent("balanceUpdated", { detail: { balance: data.newBalance } }));
        setNotification({message: "Pack opened successfully!", type: "success"});
      } else {
        setErrorDialog({message: data.error || "Failed to open pack", onRetry: handlePurchase});
      }
    } catch {
      setErrorDialog({message: "Transaction failed.", onRetry: handlePurchase});
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog.message} onClose={() => setErrorDialog(null)} onRetry={errorDialog.onRetry} />}
      
      <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-black mb-4">{pack.name}</h1>
        <p className="text-zinc-400 mb-8">Cost: {pack.price} Coins</p>

        {!result ? (
          <button
            onClick={handlePurchase}
            disabled={isOpening}
            className="bg-white text-black px-12 py-4 rounded-xl font-bold text-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {isOpening ? "Opening..." : "Open Pack"}
          </button>
        ) : (
          <div className="border border-zinc-800 p-8 rounded-2xl bg-zinc-900 animate-in fade-in zoom-in duration-300">
            <p className="text-sm uppercase tracking-widest text-zinc-500">You Won:</p>
            <h2 className="text-3xl font-bold my-4">{result.name}</h2>
            <p className="text-amber-400 font-mono">Value: {result.value} Coins</p>
            <button
              onClick={() => setResult(null)}
              className="mt-6 border border-zinc-700 px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Open Another
            </button>
          </div>
        )}
      </div>
    </>
  );
}
