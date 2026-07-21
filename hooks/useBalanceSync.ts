"use client";

import { useEffect, useCallback } from "react";

const BALANCE_PATCH_EVENT = "balanceUpdated";

/**
 * Synchronizes the current balance across the app via a shared CustomEvent bus.
 *
 * - Listens for `balanceUpdated` on `window` (payload: { detail: { balance: number } })
 * - Provides `syncBalance()` to fetch the freshest balance from `/api/user/profile`
 * - Calls `onBalanceChange` when any part of the app emits a balance update
 */
export function useBalanceSync(onBalanceChange?: (newBalance: number) => void) {
  const syncBalance = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch("/api/user/profile", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data.balance === "number") {
        window.dispatchEvent(
          new CustomEvent(BALANCE_PATCH_EVENT, { detail: { balance: data.balance } })
        );
        return data.balance;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ balance: number }>;
      if (typeof customEvent.detail?.balance === "number") {
        onBalanceChange?.(customEvent.detail.balance);
      }
    };

    window.addEventListener(BALANCE_PATCH_EVENT, handler);
    return () => window.removeEventListener(BALANCE_PATCH_EVENT, handler);
  }, [onBalanceChange]);

  return { syncBalance };
}
