"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
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
  KeyRound,
  X,
  CheckCircle2,
  ChevronRight,
  Bell,
  DollarSign,
  Palette,
  Shield,
  Globe,
  Lock,
  Unlock
} from "lucide-react";

type Rarity = "common" | "rare" | "epic" | "legendary" | "omega";
type Item = { id: string; name: string; value: number; rarity: Rarity; };
type InventoryItem = { id: string; item: Item; };
type Opening = { id: string; item: Item; createdAt: string; };

interface ProfileUser {
  id: string;
  username: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  balance: number;
  xp: number;
  level: number;
  createdAt: string;
  publicProfile: boolean;
  theme: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  showInventory: boolean;
  showBalance: boolean;
  showActivity: boolean;
}

interface ProfilePageProps {
  params: { userId: string };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = params;
  const { data: session, update: updateSession } = useSession();
  const { accountXp, accountLevel, progressionMetrics, fetchProgress } = useProgression();
  const { setTheme: setNextTheme } = useTheme();

  const isOwnProfile = session?.user?.id === userId;

  // States
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [tabs, setTabs] = useState<"overview" | "inventory" | "activity">("overview");
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState(1);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  // Settings states (only for own profile)
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memberSince, setMemberSince] = useState<string>("");
  const [profileTab, setProfileTab] = useState<"profile" | "security" | "appearance" | "notifications" | "privacy">("profile");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState<"cyber" | "neon" | "dark" | "minimal">("dark");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showInventory, setShowInventory] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [settingsModal, setSettingsModal] = useState(false);

  // Safe JSON Parsing Helper
  const safeParseJson = async (res: Response) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    const htmlText = await res.text();
    console.error("Received non-JSON response from server:", htmlText);
    throw new Error(`Server returned unexpected format (Status: ${res.status})`);
  };

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await safeParseJson(res);
      setProfileUser(data);

      if (isOwnProfile && session?.user) {
        setNewUsername(data.username || session.user.name || "");
        setAvatarUrl(data.image || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setMemberSince(
          data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }) : ""
        );
        if (data.theme) {
          setTheme(data.theme);
          setNextTheme(data.theme);
        }
        setPushNotifications(data.pushNotifications ?? true);
        setEmailNotifications(data.emailNotifications ?? false);
        setShowInventory(data.showInventory ?? true);
        setShowBalance(data.showBalance ?? true);
        setShowActivity(data.showActivity ?? true);
        setPublicProfile(data.publicProfile ?? true);
      }
    } catch (e) {
      console.error("Fetch Profile Error:", e);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId, isOwnProfile, session?.user, setNextTheme]);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!isOwnProfile && !profileUser?.publicProfile) {
      setLoadingInventory(false);
      return;
    }
    try {
      setLoadingInventory(true);
      const res = await fetch(`/api/user/${userId}/inventory`);
      const data = await safeParseJson(res);
      setInventory(data.inventory || []);
    } catch (e) {
      console.error("Fetch Inventory Error:", e);
    } finally {
      setLoadingInventory(false);
    }
  }, [userId, isOwnProfile, profileUser?.publicProfile]);

  // Fetch openings
  const fetchOpenings = useCallback(async () => {
    if (!isOwnProfile && !profileUser?.publicProfile) {
      setLoadingActivity(false);
      return;
    }
    try {
      setLoadingActivity(true);
      const res = await fetch(`/api/user/${userId}/openings`);
      const data = await safeParseJson(res);
      setOpenings(data.openings || []);
    } catch (e) {
      console.error("Fetch Openings Error:", e);
    } finally {
      setLoadingActivity(false);
    }
  }, [userId, isOwnProfile, profileUser?.publicProfile]);

  useEffect(() => {
    fetchProfile();

    if (isOwnProfile || (profileUser && profileUser.publicProfile)) {
      fetchInventory();
      fetchOpenings();
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }

    if (isOwnProfile) {
      const handleLevelUpToast = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.level) {
          const newLvl = customEvent.detail.level;
          setLeveledUpTo(newLvl);
          setShowLevelUpAlert(true);
        }
        fetchOpenings();
        fetchInventory();
      };

      const handleBalanceChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ balance: number }>;
        if (typeof customEvent.detail?.balance === "number") {
          fetchProgress();
        }
      };

      window.addEventListener("triggerLevelUpToast", handleLevelUpToast);
      window.addEventListener("balanceUpdated", handleBalanceChange);
      return () => {
        window.removeEventListener("triggerLevelUpToast", handleLevelUpToast);
        window.removeEventListener("balanceUpdated", handleBalanceChange);
      };
    }
  }, [fetchProfile, fetchInventory, fetchOpenings, fetchProgress, isOwnProfile, profileUser?.publicProfile]);

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 p-3 sm:p-6 md:p-8 relative overflow-hidden">
      {loadingProfile ? (
        <p>Loading profile...</p>
      ) : !profileUser ? (
        <p>Profile not found.</p>
      ) : (
        <>
          {/* Profile Header */}
          <div className="mb-6">
            <div className="flex items-center">
              {profileUser.image ? (
                <img src={profileUser.image} alt="Avatar" className="w-16 h-16 rounded-full" />
              ) : (
                <User className="w-16 h-16 text-slate-400" />
              )}
              <div className="ml-4">
                <h1 className="text-2xl font-black text-white">{profileUser.username}</h1>
                <p className="text-slate-400">
                  Level {profileUser.level} • {profileUser.xp.toLocaleString()} XP
                </p>
                {profileUser.bio && (
                  <p className="text-slate-300 mt-1">{profileUser.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          {isOwnProfile ? (
            <div className="mb-4 flex">
              <button onClick={() => setTabs("overview")} className={tabs === "overview" ? "text-amber-400" : "text-slate-400"}>
                Overview
              </button>
              <button onClick={() => setTabs("inventory")} className={`ml-4 ${tabs === "inventory" ? "text-amber-400" : "text-slate-400"}`}>
                Inventory
              </button>
              <button onClick={() => setTabs("activity")} className={`ml-4 ${tabs === "activity" ? "text-amber-400" : "text-slate-400"}`}>
                Activity
              </button>
            </div>
          ) : null}

          {/* Tab Content */}
          {tabs === "overview" && (
            <div>
              <h2 className="text-xl font-black text-white mb-4">Overview</h2>
              <p className="text-slate-400">
                Member since: {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
              {isOwnProfile || profileUser.publicProfile ? (
                <>
                  <p className="text-slate-400">
                    Balance: {profileUser.balance.toLocaleString()} coins
                  </p>
                  <p className="text-slate-400">
                    Inventory: {inventory.length} items
                  </p>
                  <p className="text-slate-400">
                    Openings: {openings.length}
                  </p>
                </>
              ) : (
                <p className="text-slate-400">This profile is private.</p>
              )}
            </div>
          )}

          {tabs === "inventory" && isOwnProfile && (
            <div>
              <h2 className="text-xl font-black text-white mb-4">Inventory</h2>
              <p>Inventory UI would be similar to the original profile page.</p>
            </div>
          )}

          {tabs === "activity" && isOwnProfile && (
            <div>
              <h2 className="text-xl font-black text-white mb-4">Activity</h2>
              <p>Activity UI would be similar to the original profile page.</p>
            </div>
          )}

          {/* Settings Modal (own profile only) */}
          {isOwnProfile && (
            <>
              <button onClick={() => setSettingsModal(true)} className="mb-4">
                Edit Settings
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}