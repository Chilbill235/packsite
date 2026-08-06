"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Mail, MapPin, Coins, Sparkles, Activity, Layers, Shield, Lock, Unlock } from "lucide-react";

type UserData = {
  id: string;
  username: string;
  image?: string | null;
  bio?: string | null;
  location?: string | null;
  balance: number;
  xp: number;
  level: number;
  createdAt: string;
  publicProfile: boolean;
};

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwner = session?.user?.id === userId;

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/user/${userId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        const data: UserData = await res.json();
        setUser(data);
      } catch (err: any) {
        console.error("USER_PROFILE_ERROR", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div className="flex h-[20vh] items-center justify-center text-slate-400">Loading profile…</div>;
  if (error) return <div className="p-6 text-red-400 bg-red-50/10 rounded-xl border border-red-500/20">{error}</div>;
  if (!user) return <div className="p-6 text-slate-400">User not found.</div>;

  // Determine visibility: show full data if public or owner
  const showFull = user.publicProfile || isOwner;

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f111a_1px,transparent_1px),linear-gradient(to_bottom,#0f111a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6">
          <div className="flex flex-col items-center sm:text-left">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32">
              <div className="w-full h-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-[1.5px] rounded-2xl shadow-xl">
                <div className="w-full h-full bg-[#05060b] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-400 w-8 h-8" />
                  )}
                </div>
              </div>
              <h1 className="mt-4 text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
                {/* Show user ID as the profile name per request */}
                {userId}
                {/* Optionally also show username if different */}
                {user.username !== userId && (
                  <span className="ml-2 text-xs text-slate-400 uppercase tracking-widest">(@{user.username})</span>
                )}
              </h1>
              {user.bio && showFull && (
                <p className="mt-2 text-xs text-slate-400 max-w-sm">{user.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Coin className="text-amber-400 w-4 h-4" />
                <span className="{showFull ? 'text-amber-400' : 'text-slate-400'}">
                  {showFull ? user.balance.toLocaleString() : "???"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-yellow-400 w-4 h-4" />
                <span className="{showFull ? 'text-yellow-400' : 'text-slate-400'}">
                  {showFull ? user.xp.toLocaleString() : "???"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="text-green-400 w-4 h-4" />
                <span className="{showFull ? 'text-green-400' : 'text-slate-400'}">
                  {showFull ? user.level : "???"}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Follow / Message buttons (placeholder) */}
          <div className="flex flex-col sm:flex-row gap-3 sm:mt-0">
            <Link href={`/user/${userId}/messages`} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-center text-xs font-semibold hover:bg-slate-700 transition">
              Message
            </Link>
            {(!isOwner && user.publicProfile) && (
              <button className="flex-1 sm:flex-none px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-center text-xs font-semibold hover:bg-amber-500/30 transition">
                Follow
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-950/60 px-2 py-0.5 rounded-xl">
          <button
            onClick={() => {/* setTab('overview') */}}
            className="flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all "
          >
            Overview
          </button>
          <button
            onClick={() => {/* setTab('inventory') */}}
            className="flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all"
          >
            Inventory
          </button>
          <button
            onClick={() => {/* setTab('activity') */}}
            className="flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all"
          >
            Activity
          </button>
        </div>

        {/* Content placeholder - could expand later */}
        <div className="mt-6 space-y-4">
          {/* Location */}
          {showFull && user.location && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{user.location}</span>
            </div>
          )}

          {/* Member since */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-xs font-mono">Member since:</span>
            <span>{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 text-sm">
            {user.publicProfile ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Public Profile</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 font-semibold">Private Profile</span>
              </>
            )}
          </div>

          {/* If not public and not owner, show a notice */}
          {!showFull && !isOwner && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
              <p className="text-xs text-slate-400">
                This profile is private. Only the owner can view full details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}