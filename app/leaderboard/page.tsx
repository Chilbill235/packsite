"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Coins,
  Sparkles,
  Search,
  Crown,
  Flame,
  User,
  ShieldAlert,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Activity,
  X,
  Medal,
  Award,
  Sparkle,
} from "lucide-react";

type LeaderboardUser = {
  id: string;
  username: string;
  image?: string | null;
  balance: number;
  xp: number;
  level: number;
  bio?: string | null;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Selected User Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "weekly" | "daily">("all");
  const [sortBy, setSortBy] = useState<"balance" | "level" | "xp">("balance");
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: any) {
        console.error("LEADERBOARD_ERROR", err);
        setError(err.message || "Failed to load leaderboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "balance") return b.balance - a.balance;
        if (sortBy === "level") return b.level - a.level;
        return (b.xp || 0) - (a.xp || 0);
      });
  }, [users, searchQuery, sortBy]);

  const topThree = filteredUsers.slice(0, 3);
  const remainingUsers = filteredUsers.slice(3);

  const totalCoinsInCirculation = useMemo(
    () => users.reduce((acc, u) => acc + (u.balance || 0), 0),
    [users]
  );

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 px-4 py-8 sm:px-8 lg:px-12 relative overflow-x-hidden font-sans pb-48">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-amber-500/15 via-purple-600/10 to-transparent blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* 🌟 STATS OVERVIEW CARDS */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        >
          <StatBox 
            icon={<Coins className="w-5 h-5 text-amber-400" />} 
            label="Total Pool" 
            value={`${totalCoinsInCirculation.toLocaleString()} COINS`}
            accent="border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
          />
          <StatBox 
            icon={<Activity className="w-5 h-5 text-purple-400" />} 
            label="Active Players" 
            value={users.length.toLocaleString()} 
            accent="border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40"
          />
          <StatBox 
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
            label="Top High Roller" 
            value={users[0]?.username || "N/A"} 
            accent="border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
          />
          <StatBox 
            icon={<Zap className="w-5 h-5 text-blue-400" />} 
            label="Season Status" 
            value="SEASON 4 LIVE" 
            accent="border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
          />
        </motion.div>

        {/* 🏆 HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Hall of Fame • Season 4
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 uppercase tracking-tight drop-shadow-sm">
            Leaderboard
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-400 max-w-md font-medium">
            Outrank competitors, gain prestige, and claim seasonal rewards.
          </p>
        </motion.div>

        {/* 🎛️ CONTROL BAR (Search & Filters) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl"
        >
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all shadow-inner"
            />
          </div>

          {/* Timeframe & Metric Toggle Group */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Timeframe Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
              {(["all", "weekly", "daily"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    timeframe === t
                      ? "bg-amber-500 text-black shadow-lg font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Metric Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setSortBy("balance")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === "balance"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                Coins
              </button>
              <button
                onClick={() => setSortBy("level")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === "level"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                LVL
              </button>
            </div>
          </div>
        </motion.div>

        {/* LOADING SKELETONS */}
        {loading && (
          <div className="space-y-4 py-8">
            <div className="h-64 bg-slate-900/40 rounded-3xl animate-pulse border border-white/5" />
            <div className="h-16 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
            <div className="h-16 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="p-8 text-center bg-red-950/30 border border-red-500/30 rounded-3xl backdrop-blur-md max-w-md mx-auto space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-xs sm:text-sm text-red-200 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 👑 TOP 3 PODIUM SECTION */}
            {topThree.length > 0 && !searchQuery && (
              <div className="pt-8 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  
                  {/* RANK 2 - SILVER */}
                  {topThree[1] && (
                    <PodiumCard
                      user={topThree[1]}
                      rank={2}
                      badgeBg="bg-slate-300 text-slate-950 font-black"
                      borderColor="border-slate-400/30 bg-slate-900/50 shadow-[0_0_35px_rgba(148,163,184,0.1)]"
                      orderClass="order-2 md:order-1"
                      delay={0.3}
                      onSelect={() => setSelectedUser(topThree[1])}
                    />
                  )}

                  {/* RANK 1 - GOLD CHAMPION */}
                  {topThree[0] && (
                    <PodiumCard
                      user={topThree[0]}
                      rank={1}
                      badgeBg="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] font-black"
                      borderColor="border-amber-400/60 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.25)]"
                      isFirstPlace
                      orderClass="order-1 md:order-2"
                      delay={0.2}
                      onSelect={() => setSelectedUser(topThree[0])}
                    />
                  )}

                  {/* RANK 3 - BRONZE */}
                  {topThree[2] && (
                    <PodiumCard
                      user={topThree[2]}
                      rank={3}
                      badgeBg="bg-amber-800 text-amber-100 font-black"
                      borderColor="border-amber-800/40 bg-slate-900/50 shadow-[0_0_35px_rgba(180,83,9,0.1)]"
                      orderClass="order-3 md:order-3"
                      delay={0.4}
                      onSelect={() => setSelectedUser(topThree[2])}
                    />
                  )}

                </div>
              </div>
            )}

            {/* 📋 LEADERBOARD LIST TABLE (#4 AND BELOW) */}
            <div className="space-y-3">
              {(searchQuery ? filteredUsers : remainingUsers).map((user, idx) => {
                const rank = searchQuery ? idx + 1 : idx + 4;
                const xpPercent = Math.min(100, ((user.xp || 0) % 1000) / 10);

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    whileHover={{ scale: 1.008, x: 4 }}
                    onClick={() => setSelectedUser(user)}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/90 border border-white/5 hover:border-amber-500/40 transition-all duration-300 backdrop-blur-xl gap-3 sm:gap-4 shadow-lg cursor-pointer"
                  >
                    {/* User Rank + Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      {/* Rank Number */}
                      <span className="w-8 font-mono font-black text-sm sm:text-base text-slate-500 group-hover:text-amber-400 transition-colors text-center flex-shrink-0">
                        #{rank}
                      </span>

                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.username}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-amber-500/50 transition-all"
                          />
                        ) : (
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-amber-500/50 text-[9px] font-black text-amber-400">
                          {user.level || 1}
                        </span>
                      </div>

                      {/* Name & XP Bar */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {user.username}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-400">
                            LVL {user.level || 1}
                          </span>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="w-full max-w-[160px] sm:max-w-xs mt-1.5">
                          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                              style={{ width: `${xpPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Coins */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="text-left sm:text-right">
                        <div className="text-sm sm:text-lg font-black font-mono text-amber-400 tracking-tight flex items-center gap-1.5 sm:justify-end">
                          {user.balance.toLocaleString()}
                          <Coins className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                          Balance
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* 📌 FLOATING STICKY RANK BAR FOR CURRENT USER */}
      {users[0] && (
        <motion.div 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl bg-slate-950/90 border border-amber-500/50 rounded-2xl p-3 sm:p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-mono font-black text-xs sm:text-sm shadow-lg">
              #1 RANK
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-black text-white block truncate">
                {users[0].username}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Level {users[0].level || 1} High Roller
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono font-black text-amber-400 text-sm sm:text-base">
              <Coins className="w-4 h-4" />
              {users[0].balance.toLocaleString()}
            </div>
            
            {/* Functional Stats Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedUser(users[0])}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
            >
              Stats <ArrowUpRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 📊 PLAYER STATS MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <UserStatsModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// 📊 Header Mini Stat Box
function StatBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border ${accent} backdrop-blur-xl flex items-center gap-3 transition-all duration-300 shadow-lg`}>
      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-xs sm:text-sm font-black font-mono text-white truncate">{value}</p>
      </div>
    </div>
  );
}

// 👑 Podiums for Top 3 Players
function PodiumCard({
  user,
  rank,
  badgeBg,
  borderColor,
  isFirstPlace = false,
  orderClass,
  delay,
  onSelect,
}: {
  user: LeaderboardUser;
  rank: number;
  badgeBg: string;
  borderColor: string;
  isFirstPlace?: boolean;
  orderClass: string;
  delay: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6 }}
      onClick={onSelect}
      className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${borderColor} ${orderClass} ${
        isFirstPlace ? "md:-translate-y-4" : ""
      }`}
    >
      {/* Floating Crown for Champion */}
      {isFirstPlace && (
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-7 left-1/2 -translate-x-1/2"
        >
          <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
        </motion.div>
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-xl text-xs ${badgeBg}`}>
          RANK #{rank}
        </span>
        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/10">
          LVL {user.level || 1}
        </span>
      </div>

      {/* Center Avatar & Info */}
      <div className="flex flex-col items-center text-center my-4">
        <div className="relative mb-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.username}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ${
                isFirstPlace ? "ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]" : "ring-white/20"
              }`}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
              <User className="w-8 h-8" />
            </div>
          )}
        </div>

        <h3 className="font-black text-base sm:text-lg text-white truncate max-w-[160px]">
          {user.username}
        </h3>
        <p className="text-xs text-slate-400 truncate max-w-[160px] mt-0.5 font-medium">
          {user.bio || "Top Tier Contender"}
        </p>
      </div>

      {/* Bottom Coin Balance Pill */}
      <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-center gap-2 shadow-inner">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
          {user.balance.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

// 👤 PLAYER DETAILED STATS MODAL
function UserStatsModal({ user, onClose }: { user: LeaderboardUser; onClose: () => void }) {
  const currentLevel = user.level || 1;
  const currentXp = user.xp || 0;
  const xpProgress = Math.min(100, (currentXp % 1000) / 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-400/80 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
                <User className="w-10 h-10" />
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] font-mono border border-slate-950 shadow-md">
              LVL {currentLevel}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-white">{user.username}</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {user.bio || "Active PackSite Competitor"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-left">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Coin Balance
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                  {user.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-left">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Total XP
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="font-mono font-black text-purple-400 text-sm sm:text-base">
                  {currentXp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full bg-slate-900/80 p-4 rounded-2xl border border-white/10 text-left space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-bold">Level {currentLevel} Progress</span>
              <span className="text-amber-400 font-bold">{Math.round(xpProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}