"use client";

import { useEffect, useState, use, FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User as UserIcon,
  MapPin,
  Coins,
  Sparkles,
  Activity,
  Lock,
  Unlock,
  Package,
  Clock,
  MessageSquare,
  SearchX,
  RotateCcw,
  ArrowLeft,
  UserCheck,
  UserPlus,
  Send,
  X,
  ShoppingBag,
} from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  type: string;
  rarity: string;
  value?: number;
  image?: string;
  quantity: number;
};

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
};

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
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  inventory: InventoryItem[];
  activities: ActivityItem[];
};

interface PageProps {
  params: Promise<{ userId?: string; id?: string; slug?: string }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { data: session } = useSession();

  // Unwrap params safely using React.use() for Next.js compatibility
  const resolvedParams = use(params);
  const targetId =
    resolvedParams?.userId || resolvedParams?.id || resolvedParams?.slug || null;

  // State
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "activity">(
    "overview"
  );

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Quick Message Drawer State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Fetch User Data once targetId is available
  useEffect(() => {
    if (!targetId) {
      setUserNotFound(true);
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setUserNotFound(false);

        const res = await fetch(`/api/users/${targetId}`);

        if (res.status === 404 || !res.ok) {
          if (isSubscribed) {
            setUserNotFound(true);
            setUser(null);
          }
          return;
        }

        const data: UserData = await res.json();

        if (isSubscribed) {
          setUser(data);
          setIsFollowing(!!data.isFollowing);
          setFollowersCount(data.followersCount || 0);
        }
      } catch (err) {
        console.error("USER_PROFILE_FETCH_ERROR", err);
        if (isSubscribed) {
          setUserNotFound(true);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isSubscribed = false;
    };
  }, [targetId]);

  // Handle ESC key press for modal closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMessageModal) {
        setShowMessageModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMessageModal]);

  const sessionUserId = (session?.user as { id?: string })?.id;
  const isOwner =
    Boolean(sessionUserId) &&
    (sessionUserId === user?.id || sessionUserId === targetId);

  const handleFollowToggle = async () => {
    if (!session || followLoading || !user) return;

    setFollowLoading(true);
    const nextState = !isFollowing;

    // Optimistic Update
    setIsFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextState ? "follow" : "unfollow" }),
      });

      if (!res.ok) {
        // Rollback on failure
        setIsFollowing(!nextState);
        setFollowersCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch (err) {
      console.error("FOLLOW_TOGGLE_ERROR", err);
      setIsFollowing(!nextState);
      setFollowersCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage || !user) return;

    setSendingMessage(true);
    setMessageStatus("idle");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: user.id,
          content: messageText.trim(),
        }),
      });

      if (res.ok) {
        const sentData = await res.json();
        setMessageStatus("success");
        setMessageText("");

        setUser((prev) =>
          prev
            ? {
                ...prev,
                activities: [
                  {
                    id: sentData.message?.id || sentData.id || String(Date.now()),
                    type: "MESSAGE_SENT",
                    description: `Sent a message to @${user.username}`,
                    timestamp: "Just now",
                  },
                  ...(prev.activities ?? []),
                ],
              }
            : prev
        );

        setTimeout(() => {
          setShowMessageModal(false);
          setMessageStatus("idle");
          setActiveTab("activity");
        }, 1200);
      } else {
        setMessageStatus("error");
      }
    } catch (err) {
      console.error("SEND_MESSAGE_ERROR", err);
      setMessageStatus("error");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex items-center gap-3 bg-slate-900/60 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-xl">
          <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <span>Locating user profile...</span>
        </div>
      </div>
    );
  }

  if (userNotFound || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 relative font-sans">
        <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner">
            <SearchX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              User Not Found
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              We couldn&apos;t find anyone with the identifier{" "}
              <span className="text-amber-400 font-mono font-semibold">
                &quot;{targetId || "unknown"}&quot;
              </span>
              .
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/5 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const showFull = user.publicProfile || isOwner;

  const getRarityBadge = (rarity: string) => {
    switch (rarity?.toUpperCase()) {
      case "LEGENDARY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "EPIC":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "RARE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "Recently"
        : date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-6 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
              <div className="w-full h-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-[2px] rounded-2xl shadow-2xl">
                <div className="w-full h-full bg-[#05060b] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="text-slate-500 w-12 h-12" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  <span>{user.username}</span>
                </h1>
                {user.bio && showFull && (
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Coins className="text-amber-400 w-4 h-4" />
                  <span className={showFull ? "text-amber-400 font-bold" : "text-slate-500"}>
                    {showFull ? user.balance.toLocaleString() : "???"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                  <Sparkles className="text-yellow-400 w-4 h-4" />
                  <span className={showFull ? "text-yellow-400 font-bold" : "text-slate-500"}>
                    {showFull ? user.xp.toLocaleString() : "???"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Activity className="text-emerald-400 w-4 h-4" />
                  <span className={showFull ? "text-emerald-400 font-bold" : "text-slate-500"}>
                    {showFull ? `LVL ${user.level}` : "???"}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-xs text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-4">
                <span>
                  <strong className="text-white font-sans">{followersCount}</strong> Followers
                </span>
                <span>
                  <strong className="text-white font-sans">{user.followingCount}</strong> Following
                </span>
              </div>
            </div>
          </div>

          {!isOwner && (
            <div className="flex sm:flex-col gap-2.5 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setShowMessageModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Message</span>
              </button>

              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 border ${
                  isFollowing
                    ? "bg-emerald-500/10 hover:bg-rose-500/10 border-emerald-500/30 text-emerald-400 hover:text-rose-400"
                    : "bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-950/80 border border-white/5 rounded-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-slate-800/90 text-white shadow-md border border-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "inventory"
                ? "bg-slate-800/90 text-white shadow-md border border-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Inventory ({user.inventory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "activity"
                ? "bg-slate-800/90 text-white shadow-md border border-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Activity ({user.activities?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/30 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {showFull && user.location && (
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{user.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm">
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
            </div>
          )}

          {activeTab === "inventory" && (
            <div>
              {user.inventory && user.inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {user.inventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:border-white/10 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 text-amber-400 shrink-0 overflow-hidden relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          {item.value !== undefined && (
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              ${item.value}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md border ${getRarityBadge(
                              item.rarity
                            )}`}
                          >
                            {item.rarity}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No inventory items found.
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {user.activities && user.activities.length > 0 ? (
                <div className="space-y-3">
                  {user.activities.map((act) => (
                    <div
                      key={act.id}
                      className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex items-center gap-4"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 shrink-0 text-amber-400">
                        {act.type === "MESSAGE_SENT" ? (
                          <MessageSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200">{act.description}</p>
                        <span className="text-[10px] font-mono text-slate-500">
                          {act.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No recent activity logged.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Message @{user.username}
                </h3>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {messageStatus === "success" ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs text-center font-semibold">
                Message sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write your message to ${user.username}...`}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  autoFocus
                />

                {messageStatus === "error" && (
                  <p className="text-[11px] text-rose-400 text-center">
                    Failed to send message. Please try again.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingMessage ? "Sending..." : "Send"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}