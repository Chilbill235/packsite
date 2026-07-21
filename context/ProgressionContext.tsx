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

  // XP Formula - EXACT MATCH to backend (app/api/packs/open/route.ts)
  const getXpForLevel = useCallback((level: number) => {
    return Math.floor(100 * Math.pow(level, 1.5));
  }, []);

  const calculateLevelFromXp = useCallback((xp: number): number => {
    let level = 1;
    let remainingXp = Math.max(0, xp);
    while (remainingXp >= getXpForLevel(level)) {
      remainingXp -= getXpForLevel(level);
      level++;
    }
    return level;
  }, [getXpForLevel]);

  const getTotalXpForLevel = useCallback((level: number): number => {
    let sum = 0;
    for (let i = 1; i < level; i++) {
      sum += getXpForLevel(i);
    }
    return sum;
  }, [getXpForLevel]);

  const progressionMetrics = useMemo(() => {
    const totalXpForCurrentLevel = getTotalXpForLevel(accountLevel);
    const xpEarnedInCurrentLevel = accountXp - totalXpForCurrentLevel;
    const xpNeededForNextLevel = getXpForLevel(accountLevel);
    const percentage = Math.min(Math.max((xpEarnedInCurrentLevel / xpNeededForNextLevel) * 100, 0), 100);

    return {
      currentLevelXp: Math.max(0, xpEarnedInCurrentLevel),
      nextLevelXpThreshold: xpNeededForNextLevel,
      progressPercentage: percentage,
    };
  }, [accountXp, accountLevel, getXpForLevel, getTotalXpForLevel]);

  const fetchProgress = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data && data.xp !== undefined) {
        setAccountXp(data.xp);
        if (typeof data.level === "number") {
          const minTotalXpForLevel = getTotalXpForLevel(data.level);
          if (data.xp < minTotalXpForLevel) {
            // Server level is inconsistent with actual XP; recalculate from XP
            setAccountLevel(calculateLevelFromXp(data.xp));
          } else {
            setAccountLevel(data.level);
          }
        } else {
          setAccountLevel(calculateLevelFromXp(data.xp));
        }
      }
    } catch (e) {
      console.error("Failed to sync progression pipeline:", e);
    }
  }, [session, calculateLevelFromXp, getTotalXpForLevel]);

  const updateXpLocally = useCallback((newXp: number) => {
    const newLvl = calculateLevelFromXp(newXp);
    setAccountXp(newXp);
    setAccountLevel(newLvl);
  }, [calculateLevelFromXp]);

  useEffect(() => {
    if (session?.user) {
      // Sync progression data from backend whenever the session changes
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [fetchProgress, calculateLevelFromXp]);

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
