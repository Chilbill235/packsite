"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

interface ProgressionMetrics {
  currentLevelXp: number;
  nextLevelXpThreshold: number;
  progressPercentage: number;
}

interface ProgressionContextType {
  accountXp: number;
  accountLevel: number;
  progressionMetrics: ProgressionMetrics;
  fetchProgress: () => Promise<void>;
  updateXpLocally: (newXp: number) => void;
}

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined);

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [accountXp, setAccountXp] = useState(0);
  const [accountLevel, setAccountLevel] = useState(1);

  // Core Progression Formula Matrix
  const xpForCurrentLevel = useCallback((lvl: number) => {
    if (lvl <= 1) return 0;
    return ((lvl - 1) * lvl * 125) / 2;
  }, []);

  const xpForNextLevel = useCallback((lvl: number) => {
    return lvl * 125;
  }, []);

  const calculateLevelFromXp = (xp: number): number => {
    const calculated = Math.floor(1 + Math.sqrt(1 + (8 * xp) / 125)) / 2;
    return Math.floor(calculated) || 1;
  };

  const progressionMetrics = useMemo(() => {
    const xpEarnedInCurrentLevel = accountXp - xpForCurrentLevel(accountLevel);
    const xpNeededForNextLevel = xpForNextLevel(accountLevel);
    const percentage = Math.min(Math.max((xpEarnedInCurrentLevel / xpNeededForNextLevel) * 100, 0), 100);

    return {
      currentLevelXp: xpEarnedInCurrentLevel,
      nextLevelXpThreshold: xpNeededForNextLevel,
      progressPercentage: percentage,
    };
  }, [accountXp, accountLevel, xpForCurrentLevel, xpForNextLevel]);

  const fetchProgress = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data && data.xp !== undefined) {
        setAccountXp(data.xp);
        setAccountLevel(calculateLevelFromXp(data.xp));
      }
    } catch (e) {
      console.error("Failed to sync progression pipeline:", e);
    }
  }, [session]);

  const updateXpLocally = useCallback((newXp: number) => {
    setAccountXp(newXp);
    setAccountLevel(calculateLevelFromXp(newXp));
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProgress();
    }
  }, [session, fetchProgress]);

  // Global Event Broker Hooks (for cross-component system communications)
  useEffect(() => {
    const handleXpUpdateEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.xp !== undefined) {
        const targetXp = customEvent.detail.xp;
        const finalLvl = calculateLevelFromXp(targetXp);
        
        setAccountLevel((prev) => {
          if (prev < finalLvl && prev !== 1) {
            // Dispatch standard browser event so pages can trigger their custom Level-Up animations
            window.dispatchEvent(new CustomEvent("triggerLevelUpToast", { detail: { level: finalLvl } }));
          }
          return finalLvl;
        });
        setAccountXp(targetXp);
      }
    };

    window.addEventListener("xpUpdated", handleXpUpdateEvent);
    window.addEventListener("balanceUpdated", fetchProgress);

    return () => {
      window.removeEventListener("xpUpdated", handleXpUpdateEvent);
      window.removeEventListener("balanceUpdated", fetchProgress);
    };
  }, [fetchProgress]);

  return (
    <ProgressionContext.Provider value={{ accountXp, accountLevel, progressionMetrics, fetchProgress, updateXpLocally }}>
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression() {
  const context = useContext(ProgressionContext);
  if (!context) {
    throw new Error("useProgression must be utilized within a valid ProgressionProvider wrapper");
  }
  return context;
}