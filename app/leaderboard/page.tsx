import Link from "next/link";
import { useEffect, useState } from "react";
import { Coin, Sparkles, Trophy, User } from "lucide-react";

type LeaderboardUser = {
  id: string;
  username: string;
  image?: string | null;
  balance: number;
  xp: number;
  level: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users");
        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status}`);
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: any) {
        console.error("LEADERBOARD_ERROR", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="flex h-[20vh] items-center justify-center text-slate-400">Loading leaderboard…</div>;
  if (error) return <div className="p-6 text-red-400 bg-red-50/10 rounded-xl border border-red-500/20">{error}</div>;

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f111a_1px,transparent_1px),linear-gradient(to_bottom,#0f111a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
              Leaderboard
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Top players by balance
          </p>
        </div>

        {users.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            No public users found.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, idx) => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-950/60 rounded-xl border border-white/5">
                {/* Rank */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-500 text-xs font-black rounded-full">
                  {idx + 1}
                </div>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-black text-white">
                      {user.username}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      LVL {user.level}
                    </span>
                  </div>
                  {user.bio && (
                    <p className="text-xs text-slate-400">{user.bio}</p>
                  )}
                </div>
                {/* Balance */}
                <div className="flex items-center gap-2">
                  <Coin className="w-5 h-5 text-amber-400" />
                  <span className="font-mono text-amber-400">
                    {user.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}