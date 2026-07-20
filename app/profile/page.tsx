"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useProgression } from "@/context/ProgressionContext";
import { 
  Trophy, 
  Layers, 
  Coins, 
  Calendar, 
  Sparkles, 
  Trash2, 
  Clock, 
  ArrowUpRight, 
  User,
  Zap,
  Activity,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Settings,
  Edit2,
  KeyRound,
  X,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

type Rarity = "common" | "rare" | "epic" | "legendary" | "omega";
type Item = { id: string; name: string; value: number; rarity: Rarity; };
type InventoryItem = { id: string; item: Item; };
type Opening = { id: string; item: Item; createdAt: string; };

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { accountXp, accountLevel, progressionMetrics, fetchProgress } = useProgression();
  
  // Terminal Metrics States
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");

  // Local Toast States linked to Global Event Pipeline
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState(1);

  // Sorting and Filters
  const [sortBy, setSortBy] = useState<"value-desc" | "value-asc" | "name">("value-desc");
  const [filterRarity, setFilterRarity] = useState<"all" | Rarity>("all");
  
  // Modal Overlays
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: () => void; title: string; desc: string } | null>(null);
  const [settingsModal, setSettingsModal] = useState(false);
  
  // Custom Settings Controls
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Main Database Sync Engine
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingInventory(false); 
    }
  }, []);

  const fetchOpenings = useCallback(async () => {
    try {
      const res = await fetch("/api/openings");
      const data = await res.json();
      setOpenings(data.openings || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingActivity(false); 
    }
  }, []);

  // Hook into the Global Progression system events
  useEffect(() => {
    fetchInventory();
    fetchOpenings();

    if (session?.user) {
      setNewUsername((session.user as any).username || "");
      setAvatarUrl((session.user as any).image || "");
    }

    const handleLevelUpToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.level) {
        setLeveledUpTo(customEvent.detail.level);
        setShowLevelUpAlert(true);
      }
      fetchOpenings();
      fetchInventory();
    };

    window.addEventListener("triggerLevelUpToast", handleLevelUpToast);
    return () => {
      window.removeEventListener("triggerLevelUpToast", handleLevelUpToast);
    };
  }, [fetchInventory, fetchOpenings, session]);

  const processedInventory = useMemo(() => {
    let result = [...inventory];
    if (filterRarity !== "all") {
      result = result.filter((i) => i.item.rarity === filterRarity);
    }
    return result.sort((a, b) => {
      if (sortBy === "value-desc") return b.item.value - a.item.value;
      if (sortBy === "value-asc") return a.item.value - b.item.value;
      return a.item.name.localeCompare(b.item.name);
    });
  }, [inventory, sortBy, filterRarity]);

  const handleSellAllConfirmed = async () => {
    setConfirmModal(null);
    try {
      const res = await fetch("/api/inventory/sell-all", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        await fetchInventory();
        await fetchOpenings();
        await fetchProgress(); // Resync global account statistics context
        
        // Dispatch custom event to instantly update navbar coin counters across the app
        window.dispatchEvent(new CustomEvent("balanceUpdated", { detail: { newBalance: data.newBalance } }));
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setFormStatus(null);
    try {
      const res = await fetch("/profile/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUsername, image: avatarUrl, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      
      setFormStatus({ type: "success", msg: "Security matrix updated successfully!" });
      await updateSession();
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setFormStatus({ type: "error", msg: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const getRarityConfig = (rarity: Rarity) => {
    switch (rarity) {
      case "omega":
        return {
          glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_35px_rgba(244,63,94,0.35)] border-rose-500/30 hover:border-rose-400",
          badge: "bg-gradient-to-r from-rose-600 to-red-500 text-white font-black animate-pulse",
          text: "text-rose-400 font-extrabold tracking-wide",
          bg: "from-rose-950/20 via-slate-900/40 to-slate-950/80",
          accent: "border-t-2 border-rose-500"
        };
      case "legendary":
        return {
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] border-amber-500/30 hover:border-amber-400",
          badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black",
          text: "text-amber-400 font-extrabold tracking-wide",
          bg: "from-amber-950/10 via-slate-900/40 to-slate-950/80",
          accent: "border-t-2 border-amber-500"
        };
      case "epic":
        return {
          glow: "shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] border-purple-500/20 hover:border-purple-400",
          badge: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
          text: "text-purple-400 font-bold",
          bg: "from-purple-950/10 via-slate-900/40 to-slate-950/80",
          accent: "border-t-2 border-purple-500"
        };
      case "rare":
        return {
          glow: "shadow-[0_0_10px_rgba(59,130,246,0.1)] border-blue-500/20 hover:border-blue-400",
          badge: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
          text: "text-blue-400 font-semibold",
          bg: "from-blue-950/10 via-slate-900/40 to-slate-950/80",
          accent: "border-t-2 border-blue-500"
        };
      default:
        return {
          glow: "border-zinc-800 hover:border-zinc-700 shadow-md",
          badge: "bg-zinc-800 text-zinc-400 border border-zinc-700",
          text: "text-zinc-400",
          bg: "from-zinc-900/30 to-slate-950/80",
          accent: "border-t-2 border-zinc-700"
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 p-3 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f111a_1px,transparent_1px),linear-gradient(to_bottom,#0f111a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />
      
      {/* REAL-TIME DYNAMIC LEVEL UP SYSTEM TOAST CELEBRATION */}
      <AnimatePresence>
        {showLevelUpAlert && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-[999999] sm:w-96 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-[2px] rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            <div className="bg-[#05070f] p-4 rounded-[14px] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 animate-bounce text-amber-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Level Promoted!</h4>
                  <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    Matrix Tier Upgraded <ChevronRight size={10}/> <span className="text-amber-400 font-bold">LVL {leveledUpTo}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLevelUpAlert(false)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] uppercase font-black text-white hover:bg-white/10 transition">
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY MODAL */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0b0f19] border border-red-500/30 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-center mb-2 uppercase tracking-tight text-white">{confirmModal.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm text-center mb-6 leading-relaxed">{confirmModal.desc}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-wider transition">Abort</button>
                <button onClick={confirmModal.action} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 font-black text-xs text-slate-950 uppercase tracking-wider shadow-lg shadow-red-600/20">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE SETTINGS & OVERRIDES MODAL */}
      <AnimatePresence>
        {settingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gradient-to-b from-slate-950 to-[#0b0d14] border border-white/10 p-5 sm:p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSettingsModal(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition p-2 bg-white/5 rounded-xl border border-white/5">
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Terminal Customization</h3>
                  <p className="text-xs text-slate-400">Modify your operational metadata and security keys</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {formStatus && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${formStatus.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <CheckCircle2 size={14} /> {formStatus.msg}
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Edit2 size={10}/> Public Identity Card</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Operator Username</label>
                      <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-amber-500/50 outline-none transition" placeholder="Username" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Avatar Image URL</label>
                      <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-amber-500/50 outline-none transition" placeholder="https://..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><KeyRound size={10}/> Security Key Overrides</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Current Security Key</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-amber-500/50 outline-none transition" placeholder="Required for password reset" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">New Security Key</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-xs text-white focus:border-amber-500/50 outline-none transition" placeholder="Min 6 characters" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSettingsModal(false)} className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold uppercase transition hover:bg-slate-800">Discard</button>
                  <button type="submit" disabled={updating} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-black text-xs text-slate-950 uppercase tracking-wider shadow-lg hover:brightness-110 transition disabled:opacity-50">
                    {updating ? "Syncing..." : "Apply Matrix Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-5 relative z-10">
        
        {/* CROSS-DEVICE UNIVERSAL PROFILE HUD CONTAINER */}
        <section className="w-full bg-gradient-to-b from-slate-950 via-[#0b0e17] to-slate-950 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-[2px] bg-gradient-to-r from-amber-500 to-transparent" />
          
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              
              <div className="relative mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-[1.5px] shadow-xl">
                  <div className="w-full h-full bg-[#05060b] rounded-[14px] sm:rounded-[22px] flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl("")} />
                    ) : (
                      <User className="text-slate-400 w-6 h-6 sm:w-8 sm:h-8" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black w-6 h-6 rounded-lg flex items-center justify-center border-2 border-[#05060b]">
                  {accountLevel}
                </div>
              </div>

              <div className="text-center sm:text-left w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || "OPERATOR"}
                  </h1>
                  <span className="flex items-center gap-1 text-[8px] font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                    <Zap size={8} className="fill-amber-400" /> PRO
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    <Calendar size={10} className="text-slate-500" /> Secure Matrix Active
                  </span>
                  <button onClick={() => setSettingsModal(true)} className="text-[10px] font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/20 transition">
                    <Settings size={10} /> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* RESPONSIVE REAL-TIME RADIAL XP BAR CARD */}
            <div className="w-full lg:w-80 bg-slate-900/30 backdrop-blur-md border border-white/5 p-4 rounded-xl sm:rounded-2xl flex flex-col gap-2 relative">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-amber-400" /> Account Progression Curves
                </span>
                <span className="text-[10px] font-mono font-black text-amber-400">LVL {accountLevel}</span>
              </div>
              
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-white/5">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progressionMetrics.progressPercentage}%` }} 
                  transition={{ type: "spring", stiffness: 60, damping: 15 }} 
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>{Math.floor(progressionMetrics.currentLevelXp)} / {progressionMetrics.nextLevelXpThreshold} XP</span>
                <span>Total: {accountXp} XP</span>
              </div>
            </div>
          </div>
        </section>

        {/* HUB NAV TABS */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-xl sm:rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 w-full">
            {(["overview", "inventory", "activity"] as const).map((t) => (
              <button key={t} onClick={() => setTabs(t)} className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl capitalize font-black text-[10px] sm:text-xs tracking-wider transition-all duration-200 ${tabs === t ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <span className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                  {t === "overview" && <Boxes size={12} />}
                  {t === "inventory" && <Layers size={12} />}
                  {t === "activity" && <Activity size={12} />}
                  {t.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* VIEWPORT VIEWS */}
        <main className="min-h-[350px]">
          <AnimatePresence mode="wait">
            {tabs === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Total Drops Unboxed", icon: <Trophy size={18} />, val: openings.length, color: "from-blue-500 to-cyan-500" },
                  { title: "Vault Inventory Size", icon: <Layers size={18} />, val: inventory.length, color: "from-purple-500 to-indigo-500" },
                  { title: "Net Vault Value Estimation", icon: <Coins size={18} />, val: inventory.reduce((acc, curr) => acc + curr.item.value, 0).toLocaleString(), color: "from-amber-500 to-orange-500" }
                ].map((card, idx) => (
                  <div key={idx} className="bg-gradient-to-b from-slate-950 to-[#0d1017] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{card.title}</span>
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-slate-950 shadow-sm`}>{card.icon}</div>
                    </div>
                    <h2 className="text-3xl font-black text-white font-mono tracking-tight">{loadingInventory || loadingActivity ? "---" : card.val}</h2>
                  </div>
                ))}
              </motion.div>
            )}

            {tabs === "inventory" && (
              <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value as any)} className="bg-slate-900 p-2.5 px-3 rounded-xl text-[10px] font-black border border-white/5 outline-none text-slate-300 focus:border-amber-500/50 cursor-pointer">
                      <option value="all">ALL RARITIES</option>
                      <option value="omega">OMEGA CLASS</option>
                      <option value="legendary">LEGENDARY</option>
                      <option value="epic">EPIC TIER</option>
                      <option value="rare">RARE TIER</option>
                      <option value="common">COMMON GRADE</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-900 p-2.5 px-3 rounded-xl text-[10px] font-black border border-white/5 outline-none text-slate-300 focus:border-amber-500/50 cursor-pointer">
                      <option value="value-desc">SORT: HIGHEST VALUE</option>
                      <option value="value-asc">SORT: LOWEST VALUE</option>
                      <option value="name">SORT: ALPHABETICAL</option>
                    </select>
                  </div>
                  
                  <button onClick={() => setConfirmModal({ isOpen: true, title: "Liquidate Selection Stock?", desc: "Mass sell all items matching your active viewport grid filters instantly? Action deposits credits to profile bank.", action: handleSellAllConfirmed })} className="md:ml-auto px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-950/50 transition flex items-center justify-center gap-1.5">
                    <Trash2 size={12} /> Liquidate Selection
                  </button>
                </div>
                
                {processedInventory.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl bg-slate-950/10 text-slate-500 text-xs font-mono uppercase tracking-widest">No matching terminal storage data entries</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {processedInventory.map((invItem) => {
                      const rarity = getRarityConfig(invItem.item.rarity);
                      return (
                        <motion.div layout key={invItem.id} whileHover={{ y: -4 }} className={`bg-gradient-to-b ${rarity.bg} border ${rarity.glow} rounded-xl p-3 flex flex-col justify-between items-start relative overflow-hidden transition-all duration-200 group`}>
                          <div className={`absolute top-0 left-0 right-0 h-[2px] ${rarity.accent}`} />
                          <div className="w-full aspect-square rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center text-3xl mb-3 relative group-hover:bg-slate-900 transition-colors">
                            <span>📦</span>
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[8px] uppercase tracking-widest bg-white text-slate-950 font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">INSPECT <ArrowUpRight size={8}/></span>
                            </div>
                          </div>
                          <div className="w-full space-y-1">
                            <h3 className="font-black text-[11px] truncate text-slate-200 group-hover:text-white">{invItem.item.name}</h3>
                            <p className="text-amber-400 text-[11px] font-black font-mono tracking-tighter">{invItem.item.value.toLocaleString()}</p>
                            <span className={`inline-block text-[7px] tracking-widest uppercase px-1.5 py-0.5 rounded ${rarity.badge}`}>{invItem.item.rarity}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {tabs === "activity" && (
              <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2 max-w-3xl mx-auto">
                {loadingActivity ? (
                  <div className="text-center py-20 text-[10px] font-mono text-slate-500 tracking-widest animate-pulse uppercase">Syncing server database arrays...</div>
                ) : openings.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 rounded-2xl bg-slate-950/10 text-xs font-mono tracking-widest text-slate-500 uppercase">No ledger operations recorded</div>
                ) : (
                  openings.map((op) => {
                    const rarity = getRarityConfig(op.item?.rarity || "common");
                    return (
                      <div key={op.id} className="bg-gradient-to-r from-slate-950 via-[#0d1017] to-slate-950 border border-white/5 p-3.5 rounded-xl flex justify-between items-center gap-4 hover:border-white/10 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-base flex-shrink-0">📜</div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-black text-xs text-white tracking-tight truncate">{op.item?.name || "Mystery Matrix Item"}</h3>
                              <span className={`text-[7px] font-black tracking-widest uppercase px-1 rounded ${rarity.badge}`}>{op.item?.rarity || "COMMON"}</span>
                            </div>
                            <p className="text-[9px] font-mono text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10}/> {new Date(op.createdAt).toLocaleDateString()} at {new Date(op.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end">
                          <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-black font-mono text-[11px]">
                            <TrendingUp size={10} />+{op.item?.value?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}