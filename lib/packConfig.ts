// ============================================================================
// ULTIMATE TIER CONFIGURATION & MATHEMATICAL WEIGHTS (12 TIERS)
// ============================================================================

export const TIER_CONFIG = {
  STARDUST: {
    id: "STARDUST",
    displayName: "Stardust",
    order: 1,
    qty: 10000,
    baseVal: 10,
    chance: 10000,
    valueVariance: [0.8, 1.2] as const,
    weight: 500000,
    theme: {
      color: "#9ca3af",
      glow: "rgba(156, 163, 175, 0.2)",
      border: "border-gray-500",
      badge: "bg-gray-800 text-gray-300",
      sound: "pop_common.mp3",
    },
    prefixes: ["Soggy", "Rusted", "Crusted", "Moldy", "Greasy", "Bent", "Burnt-Out", "Dented", "Petrified", "Filthy", "Expired", "Corroded"],
    suffixes: ["Cardboard", "AA Battery", "Lint Ball", "Rubble", "Wire Scraps", "Pop Tab", "Bottle Cap", "Spoon", "Receipt", "Solder Chunk", "Plastic Ring", "Thermal Paste"],
  },
  NEBULA: {
    id: "NEBULA",
    displayName: "Nebula",
    order: 2,
    qty: 5000,
    baseVal: 120,
    chance: 4000,
    valueVariance: [0.85, 1.35] as const,
    weight: 200000,
    theme: {
      color: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.3)",
      border: "border-sky-400",
      badge: "bg-sky-950 text-sky-300",
      sound: "pop_uncommon.mp3",
    },
    prefixes: ["Overclocked", "Flickering", "Scratched", "Refurbished", "Stripped", "Salvaged", "Patch-Work", "Bypassed", "Copper-Bound", "Repurposed"],
    suffixes: ["Microchip", "Heatsink", "Laser Diode", "Transistor", "Relay Unit", "Fuse Block", "Solder Joint", "Datapad Crack", "Capacitor", "Coil"],
  },
  QUANTUM: {
    id: "QUANTUM",
    displayName: "Quantum",
    order: 3,
    qty: 2500,
    baseVal: 750,
    chance: 2000,
    valueVariance: [0.9, 1.45] as const,
    weight: 75000,
    theme: {
      color: "#22c55e",
      glow: "rgba(34, 197, 94, 0.35)",
      border: "border-emerald-500",
      badge: "bg-emerald-950 text-emerald-300",
      sound: "pop_rare.mp3",
    },
    prefixes: ["Sub-Zero", "Neon-Lined", "Phased", "Kevlar-Plated", "Hyper-Threaded", "Hardened", "Neural", "Pulse-Tuned", "Optic-Grade", "Cryo-Cooled"],
    suffixes: ["Processor", "Feedback Loop", "Frequency Drive", "Interface", "Targeting Lens", "Data Injector", "Overdrive Cell", "Encoder", "Resonator", "Weave"],
  },
  GALACTIC: {
    id: "GALACTIC",
    displayName: "Galactic",
    order: 4,
    qty: 1000,
    baseVal: 3500,
    chance: 1200,
    valueVariance: [0.9, 1.6] as const,
    weight: 25000,
    theme: {
      color: "#a855f7",
      glow: "rgba(168, 85, 247, 0.4)",
      border: "border-purple-500",
      badge: "bg-purple-950 text-purple-300",
      sound: "pop_epic.mp3",
    },
    prefixes: ["Supercharged", "Plasma-Infused", "Titanium-Forged", "High-Yield", "Orbital", "Quasar-Fueled", "Vapor-Cooled", "War-Grade", "Seismic", "Apex"],
    suffixes: ["Coilgun", "Reactor Core", "Kinetic Battery", "Disruptor Field", "Shield Emitter", "Drive Matrix", "Targeting Eye", "Conduit", "Relic", "Monolith"],
  },
  VOID: {
    id: "VOID",
    displayName: "Void",
    order: 5,
    qty: 500,
    baseVal: 20000,
    chance: 150,
    valueVariance: [0.95, 1.75] as const,
    weight: 8000,
    theme: {
      color: "#ec4899",
      glow: "rgba(236, 72, 153, 0.45)",
      border: "border-pink-500",
      badge: "bg-pink-950 text-pink-300",
      sound: "pop_mythic.mp3",
    },
    prefixes: ["Abyssal", "Vantablack", "Soul-Stealing", "Forbidden", "Eldritch", "Shadow-Bound", "Null-Void", "Eclipse", "Rift-Born", "Void-Touched"],
    suffixes: ["Scythe", "Singularity Generator", "Reaper", "Phantom Blade", "Executioner", "Event Horizon", "Dark Matter Core", "Maw", "Gaze", "Tear"],
  },
  CELESTIAL: {
    id: "CELESTIAL",
    displayName: "Celestial",
    order: 6,
    qty: 200,
    baseVal: 150000,
    chance: 15,
    valueVariance: [1.0, 2.0] as const,
    weight: 2000,
    theme: {
      color: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.5)",
      border: "border-amber-500",
      badge: "bg-amber-950 text-amber-300",
      sound: "pop_legendary.mp3",
    },
    prefixes: ["Sun-Forged", "God-Tier", "Ascended", "Sovereign", "Archon", "Holy", "Empyrean", "Crown-Grade", "Genesis", "Radiant"],
    suffixes: ["Aegis", "Valiant Sword", "Halo Engine", "Sanctuary Core", "Reliquary", "Dominion", "Scepter", "Sun-Cutter", "Beacon", "Crown"],
  },
  SINGULARITY: {
    id: "SINGULARITY",
    displayName: "Singularity",
    order: 7,
    qty: 75,
    baseVal: 1000000,
    chance: 5,
    valueVariance: [1.0, 2.2] as const,
    weight: 400,
    theme: {
      color: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.6)",
      border: "border-cyan-400 animate-pulse",
      badge: "bg-cyan-950 text-cyan-300",
      sound: "pop_transcendent.mp3",
    },
    prefixes: ["TIME-WARPED", "DIMENSION-SPLITTING", "REALITY-TEARING", "ENTROPY-PROOF", "NEUTRINO-FORGED", "CHRONO-BREAKING"],
    suffixes: ["Time-Loop Core", "Paradox Blade", "Dimensional Anchor", "Reality Collapse", "Continuum Engine", "Apex Point"],
  },
  OMEGA: {
    id: "OMEGA",
    displayName: "Omega",
    order: 8,
    qty: 25,
    baseVal: 10000000,
    chance: 2,
    valueVariance: [1.0, 2.5] as const,
    weight: 80,
    theme: {
      color: "#ef4444",
      glow: "rgba(239, 68, 68, 0.75)",
      border: "border-red-500 animate-pulse",
      badge: "bg-red-950 text-red-300 font-bold",
      sound: "pop_omega.mp3",
    },
    prefixes: ["GOD-KILLER", "DOOMSDAY", "WORLD-BREAKER", "OBLITERATION", "UNBOUND-TITAN", "EXISTENTIAL-ZERO", "EXTINCTION-EVENT"],
    suffixes: ["War Engine", "Annihilator", "Judgement Cannon", "Crucible", "Cataclysm Core", "Ouroboros", "Ultimatum"],
  },
  ABSOLUTE_ZERO: {
    id: "ABSOLUTE_ZERO",
    displayName: "Absolute Zero",
    order: 9,
    qty: 10,
    baseVal: 75000000,
    chance: 1,
    valueVariance: [1.2, 3.0] as const,
    weight: 15,
    theme: {
      color: "#67e8f9",
      glow: "rgba(103, 232, 249, 0.85)",
      border: "border-cyan-200 shadow-[0_0_20px_#67e8f9]",
      badge: "bg-cyan-300 text-black font-black tracking-widest",
      sound: "pop_absolute_zero.mp3",
    },
    prefixes: ["CRYOGENIC-OVERLORD", "PERMA-FREEZE", "ZERO-KELVIN", "THERMODYNAMIC-DEATH", "STILL-EXISTENCE"],
    suffixes: ["Frost-Scythe", "Ice Core of the Void", "Absolute Zero Engine", "Glacial Tomb", "Endless Winter"],
  },
  DIVINE_ARCHON: {
    id: "DIVINE_ARCHON",
    displayName: "Divine Archon",
    order: 10,
    qty: 5,
    baseVal: 500000000,
    chance: 1,
    valueVariance: [1.5, 3.5] as const,
    weight: 4,
    theme: {
      color: "#facc15",
      glow: "rgba(250, 204, 21, 0.9)",
      border: "border-yellow-300 shadow-[0_0_30px_#facc15] animate-bounce",
      badge: "bg-yellow-400 text-black font-black uppercase",
      sound: "pop_divine.mp3",
    },
    prefixes: ["HEAVEN-COMMANDER", "ARCHANGEL-CORE", "OMNIPRESENT", "LIGHT-WEAVER", "CREATION-ENGINE"],
    suffixes: ["Judgement Blade", "Halo of Eternity", "Throne of Creation", "Sanctuary of Light", "Divine Will"],
  },
  ETERNITY: {
    id: "ETERNITY",
    displayName: "Eternity",
    order: 11,
    qty: 2,
    baseVal: 5000000000,
    chance: 1,
    valueVariance: [2.0, 5.0] as const,
    weight: 1,
    theme: {
      color: "#e879f9",
      glow: "rgba(232, 121, 249, 1.0)",
      border: "border-fuchsia-400 shadow-[0_0_40px_#e879f9]",
      badge: "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black",
      sound: "pop_eternity.mp3",
    },
    prefixes: ["TIMELESS-INFINITE", "ENDLESS-BOUNDLESS", "IMMORTAL-SPECTRUM", "NEVER-ENDING"],
    suffixes: ["Eternity Core", "Unending Loop", "Aethelgard Monolith", "Immortal Relic"],
  },
  TRANSCENDENT_OVERLORD: {
    id: "TRANSCENDENT_OVERLORD",
    displayName: "TRANSCENDENT OVERLORD",
    order: 12,
    qty: 1,
    baseVal: 50000000000,
    chance: 1,
    valueVariance: [2.5, 10.0] as const,
    weight: 0.1,
    theme: {
      color: "#ffffff",
      glow: "rgba(255, 255, 255, 1.0)",
      border: "border-white shadow-[0_0_60px_#ffffff] animate-ping",
      badge: "bg-white text-black font-black tracking-tighter ring-4 ring-purple-500",
      sound: "pop_god.mp3",
    },
    prefixes: ["MULTIVERSE-ERASING", "DEVELOPER-MODE", "REALITY-CREATOR", "OMNIPOTENT-GOD"],
    suffixes: ["OVERLORD CORE", "AUTHORITY OF EXISTENCE", "THE FINAL ITEM"],
    titles: ["THE CREATOR OF ALL", "WHO BENDS THE SERVER", "THE UNSTOPPABLE"],
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;

export const TIER_ORDER: Record<TierKey, number> = {
  STARDUST: 1,
  NEBULA: 2,
  QUANTUM: 3,
  GALACTIC: 4,
  VOID: 5,
  CELESTIAL: 6,
  SINGULARITY: 7,
  OMEGA: 8,
  ABSOLUTE_ZERO: 9,
  DIVINE_ARCHON: 10,
  ETERNITY: 11,
  TRANSCENDENT_OVERLORD: 12,
};

// ============================================================================
// ITEM MODIFIERS / AFFIX SYSTEM (PREFIX TAGS)
// ============================================================================

export interface ItemModifier {
  id: string;
  prefixTag: string;
  valueMultiplier: number;
  chance: number;
  badgeColor: string;
}

export const ITEM_MODIFIERS: ItemModifier[] = [
  { id: "STANDARD", prefixTag: "", valueMultiplier: 1.0, chance: 85.0, badgeColor: "" },
  { id: "CORRUPTED", prefixTag: "Corrupted ", valueMultiplier: 2.5, chance: 8.0, badgeColor: "text-red-500" },
  { id: "GOLDEN", prefixTag: "★ Golden ", valueMultiplier: 5.0, chance: 4.0, badgeColor: "text-yellow-400" },
  { id: "HOLOGRAPHIC", prefixTag: "✧ Holo ", valueMultiplier: 10.0, chance: 2.0, badgeColor: "text-cyan-300" },
  { id: "SECRET_PROTOTYPE", prefixTag: "☣ PROTOTYPE ", valueMultiplier: 50.0, chance: 0.9, badgeColor: "text-emerald-400 font-mono" },
  { id: "DEVELOPER_GLITCH", prefixTag: "ERR//: ", valueMultiplier: 250.0, chance: 0.1, badgeColor: "text-pink-500 animate-pulse" },
];

// ============================================================================
// PACK CONFIGURATIONS (12 UNIQUELY MAPPED PACKS ACROSS ALL 12 TIERS)
// ============================================================================

export interface PackDropRates {
  tier: TierKey;
  chancePercentage: number;
}

export interface PackConfig {
  id: string;
  name: string;
  tagline: string;
  cat: string;
  badgeText?: string;
  tierTag: string;
  tierColor: string;
  price: number;
  cardsPerPack: number;
  rarityMod: number;
  allowedRarities: TierKey[];
  minRarity: TierKey;
  guaranteedRarity?: TierKey;
  guaranteedEvery: number;
  desc: string;
  dropRates: PackDropRates[];
  visuals: {
    gradient: string;
    accentColor: string;
    glowColor: string;
  };
}

export const PACK_CONFIGS: PackConfig[] = [
  {
    id: "wayfarer-cache",
    name: "Wayfarer's Cache",
    tagline: "Starter supplies & scrap",
    cat: "Standard",
    tierTag: "STARDUST",
    tierColor: "bg-gray-800 text-gray-300 border-gray-600",
    price: 100,
    cardsPerPack: 3,
    rarityMod: 1.0,
    allowedRarities: ["STARDUST", "NEBULA"],
    minRarity: "STARDUST",
    guaranteedEvery: 10,
    desc: "A basic supply crate containing essential stardust materials.",
    dropRates: [
      { tier: "STARDUST", chancePercentage: 85.0 },
      { tier: "NEBULA", chancePercentage: 15.0 },
    ],
    visuals: {
      gradient: "from-zinc-800 to-zinc-950",
      accentColor: "#9ca3af",
      glowColor: "rgba(156, 163, 175, 0.2)",
    },
  },
  {
    id: "astral-nexus",
    name: "Astral Nexus",
    tagline: "Gateway to the stars",
    cat: "Standard",
    tierTag: "NEBULA",
    tierColor: "bg-sky-950 text-sky-300 border-sky-600",
    price: 500,
    cardsPerPack: 3,
    rarityMod: 1.2,
    allowedRarities: ["STARDUST", "NEBULA", "QUANTUM"],
    minRarity: "STARDUST",
    guaranteedRarity: "NEBULA",
    guaranteedEvery: 5,
    desc: "A gateway to the stars with improved cosmic nebula rewards.",
    dropRates: [
      { tier: "STARDUST", chancePercentage: 60.0 },
      { tier: "NEBULA", chancePercentage: 30.0 },
      { tier: "QUANTUM", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-sky-950 via-slate-900 to-indigo-950",
      accentColor: "#38bdf8",
      glowColor: "rgba(56, 189, 248, 0.3)",
    },
  },
  {
    id: "quantum-surge-crate",
    name: "Quantum Surge Crate",
    tagline: "Sub-zero quantum tech",
    cat: "Standard",
    tierTag: "QUANTUM",
    tierColor: "bg-emerald-950 text-emerald-300 border-emerald-600",
    price: 1500,
    cardsPerPack: 3,
    rarityMod: 1.35,
    allowedRarities: ["NEBULA", "QUANTUM", "GALACTIC"],
    minRarity: "NEBULA",
    guaranteedRarity: "QUANTUM",
    guaranteedEvery: 7,
    desc: "Advanced hardware driven by intense quantum energy fields.",
    dropRates: [
      { tier: "NEBULA", chancePercentage: 55.0 },
      { tier: "QUANTUM", chancePercentage: 35.0 },
      { tier: "GALACTIC", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-emerald-950 via-slate-900 to-teal-950",
      accentColor: "#22c55e",
      glowColor: "rgba(34, 197, 94, 0.35)",
    },
  },
  {
    id: "void-walkers-trove",
    name: "Void Walker's Trove",
    tagline: "Abyssal treasures",
    cat: "Premium",
    badgeText: "POPULAR",
    tierTag: "GALACTIC",
    tierColor: "bg-purple-950 text-purple-300 border-purple-600",
    price: 5000,
    cardsPerPack: 4,
    rarityMod: 1.5,
    allowedRarities: ["QUANTUM", "GALACTIC", "VOID"],
    minRarity: "QUANTUM",
    guaranteedRarity: "GALACTIC",
    guaranteedEvery: 8,
    desc: "Dare to walk the void for a chance at galactic artifacts.",
    dropRates: [
      { tier: "QUANTUM", chancePercentage: 50.0 },
      { tier: "GALACTIC", chancePercentage: 35.0 },
      { tier: "VOID", chancePercentage: 15.0 },
    ],
    visuals: {
      gradient: "from-purple-950 via-zinc-950 to-pink-950",
      accentColor: "#a855f7",
      glowColor: "rgba(168, 85, 247, 0.4)",
    },
  },
  {
    id: "abyssal-rift-box",
    name: "Abyssal Rift Box",
    tagline: "Dark matter anomalies",
    cat: "Premium",
    tierTag: "VOID",
    tierColor: "bg-pink-950 text-pink-300 border-pink-600",
    price: 25000,
    cardsPerPack: 4,
    rarityMod: 2.0,
    allowedRarities: ["GALACTIC", "VOID", "CELESTIAL"],
    minRarity: "GALACTIC",
    guaranteedRarity: "VOID",
    guaranteedEvery: 10,
    desc: "Unstable rifts yielding dark matter and void equipment.",
    dropRates: [
      { tier: "GALACTIC", chancePercentage: 55.0 },
      { tier: "VOID", chancePercentage: 35.0 },
      { tier: "CELESTIAL", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-pink-950 via-purple-950 to-slate-950",
      accentColor: "#ec4899",
      glowColor: "rgba(236, 72, 153, 0.45)",
    },
  },
  {
    id: "celestial-vault",
    name: "Celestial Vault",
    tagline: "Cosmic artifacts",
    cat: "Premium",
    tierTag: "CELESTIAL",
    tierColor: "bg-amber-950 text-amber-300 border-amber-500",
    price: 100000,
    cardsPerPack: 4,
    rarityMod: 2.5,
    allowedRarities: ["VOID", "CELESTIAL", "SINGULARITY"],
    minRarity: "VOID",
    guaranteedRarity: "CELESTIAL",
    guaranteedEvery: 12,
    desc: "The vault of the cosmos holds the rarest celestial artifacts.",
    dropRates: [
      { tier: "VOID", chancePercentage: 60.0 },
      { tier: "CELESTIAL", chancePercentage: 30.0 },
      { tier: "SINGULARITY", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-amber-950 via-purple-950 to-black",
      accentColor: "#f59e0b",
      glowColor: "rgba(245, 158, 11, 0.5)",
    },
  },
  {
    id: "singularity-core",
    name: "Singularity Core",
    tagline: "Time-warped dimensions",
    cat: "Exotic",
    badgeText: "RARE",
    tierTag: "SINGULARITY",
    tierColor: "bg-cyan-950 text-cyan-300 border-cyan-400",
    price: 500000,
    cardsPerPack: 5,
    rarityMod: 3.5,
    allowedRarities: ["CELESTIAL", "SINGULARITY", "OMEGA"],
    minRarity: "CELESTIAL",
    guaranteedRarity: "SINGULARITY",
    guaranteedEvery: 10,
    desc: "Dimension-splitting cores that bend entropy and time.",
    dropRates: [
      { tier: "CELESTIAL", chancePercentage: 60.0 },
      { tier: "SINGULARITY", chancePercentage: 30.0 },
      { tier: "OMEGA", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-cyan-950 via-teal-950 to-black",
      accentColor: "#06b6d4",
      glowColor: "rgba(6, 182, 212, 0.6)",
    },
  },
  {
    id: "omega-sanctum",
    name: "Omega Sanctum",
    tagline: "Reality-breaking power",
    cat: "Mythic",
    badgeText: "ENDGAME",
    tierTag: "OMEGA",
    tierColor: "bg-red-950 text-red-300 border-red-500 font-bold",
    price: 2500000,
    cardsPerPack: 5,
    rarityMod: 4.5,
    allowedRarities: ["SINGULARITY", "OMEGA", "ABSOLUTE_ZERO"],
    minRarity: "SINGULARITY",
    guaranteedRarity: "OMEGA",
    guaranteedEvery: 15,
    desc: "The ultimate pack containing reality-breaking omega items.",
    dropRates: [
      { tier: "SINGULARITY", chancePercentage: 65.0 },
      { tier: "OMEGA", chancePercentage: 28.0 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 7.0 },
    ],
    visuals: {
      gradient: "from-red-950 via-rose-950 to-black",
      accentColor: "#ef4444",
      glowColor: "rgba(239, 68, 68, 0.8)",
    },
  },
  {
    id: "absolute-zero-chamber",
    name: "Absolute Zero Chamber",
    tagline: "Thermodynamic death",
    cat: "God Tier",
    badgeText: "FROST",
    tierTag: "ABSOLUTE_ZERO",
    tierColor: "bg-cyan-300 text-black font-black tracking-widest",
    price: 10000000,
    cardsPerPack: 5,
    rarityMod: 6.0,
    allowedRarities: ["OMEGA", "ABSOLUTE_ZERO", "DIVINE_ARCHON"],
    minRarity: "OMEGA",
    guaranteedRarity: "ABSOLUTE_ZERO",
    guaranteedEvery: 12,
    desc: "Perma-freeze technology that reaches 0 Kelvin.",
    dropRates: [
      { tier: "OMEGA", chancePercentage: 60.0 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 30.0 },
      { tier: "DIVINE_ARCHON", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-cyan-900 via-sky-950 to-black",
      accentColor: "#67e8f9",
      glowColor: "rgba(103, 232, 249, 0.85)",
    },
  },
  {
    id: "divine-archon-domain",
    name: "Divine Archon Domain",
    tagline: "Heaven-commander command",
    cat: "God Tier",
    badgeText: "DIVINE",
    tierTag: "DIVINE_ARCHON",
    tierColor: "bg-yellow-400 text-black font-black uppercase",
    price: 50000000,
    cardsPerPack: 6,
    rarityMod: 8.0,
    allowedRarities: ["ABSOLUTE_ZERO", "DIVINE_ARCHON", "ETERNITY"],
    minRarity: "ABSOLUTE_ZERO",
    guaranteedRarity: "DIVINE_ARCHON",
    guaranteedEvery: 10,
    desc: "Archangel-core halos and judgment blades of light.",
    dropRates: [
      { tier: "ABSOLUTE_ZERO", chancePercentage: 60.0 },
      { tier: "DIVINE_ARCHON", chancePercentage: 32.0 },
      { tier: "ETERNITY", chancePercentage: 8.0 },
    ],
    visuals: {
      gradient: "from-amber-900 via-yellow-950 to-black",
      accentColor: "#facc15",
      glowColor: "rgba(250, 204, 21, 0.9)",
    },
  },
  {
    id: "eternity-spire",
    name: "Eternity Spire",
    tagline: "Timeless-infinite monoliths",
    cat: "God Tier",
    badgeText: "ETERNAL",
    tierTag: "ETERNITY",
    tierColor: "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black",
    price: 250000000,
    cardsPerPack: 6,
    rarityMod: 10.0,
    allowedRarities: ["DIVINE_ARCHON", "ETERNITY", "TRANSCENDENT_OVERLORD"],
    minRarity: "DIVINE_ARCHON",
    guaranteedRarity: "ETERNITY",
    guaranteedEvery: 8,
    desc: "Unending loops and immortal relic monoliths across time.",
    dropRates: [
      { tier: "DIVINE_ARCHON", chancePercentage: 60.0 },
      { tier: "ETERNITY", chancePercentage: 35.0 },
      { tier: "TRANSCENDENT_OVERLORD", chancePercentage: 5.0 },
    ],
    visuals: {
      gradient: "from-fuchsia-950 via-purple-950 to-black",
      accentColor: "#e879f9",
      glowColor: "rgba(232, 121, 249, 1.0)",
    },
  },
  {
    id: "reality-collapse-catalyst",
    name: "Reality Collapse Catalyst",
    tagline: "Multiverse-erasing authority",
    cat: "God Tier",
    badgeText: "OVERLORD",
    tierTag: "TRANSCENDENT",
    tierColor: "bg-white text-black font-black border-purple-500",
    price: 1000000000,
    cardsPerPack: 7,
    rarityMod: 12.0,
    allowedRarities: ["ETERNITY", "TRANSCENDENT_OVERLORD"],
    minRarity: "ETERNITY",
    guaranteedRarity: "TRANSCENDENT_OVERLORD",
    guaranteedEvery: 5,
    desc: "Direct access to the Creator of All and Developer Mode.",
    dropRates: [
      { tier: "ETERNITY", chancePercentage: 90.0 },
      { tier: "TRANSCENDENT_OVERLORD", chancePercentage: 10.0 },
    ],
    visuals: {
      gradient: "from-fuchsia-950 via-white/10 to-black",
      accentColor: "#ffffff",
      glowColor: "rgba(255, 255, 255, 1.0)",
    },
  },
];

// ============================================================================
// HELPER METHODS
// ============================================================================

export function getPackConfig(identifier: string): PackConfig | undefined {
  const query = identifier.toLowerCase();
  return PACK_CONFIGS.find(
    (p) => p.name.toLowerCase() === query || p.id.toLowerCase() === query
  );
}

export function getExclusiveRarities(): TierKey[] {
  return ["SINGULARITY", "OMEGA", "ABSOLUTE_ZERO", "DIVINE_ARCHON", "ETERNITY", "TRANSCENDENT_OVERLORD"];
}

export function toTierKey(rarity?: string | null): TierKey {
  if (!rarity) return "STARDUST";
  const key = rarity.toUpperCase() as TierKey;
  return key in TIER_CONFIG ? key : "STARDUST";
}

export function getRandomModifier(): ItemModifier {
  const roll = Math.random() * 100;
  let accumulated = 0;
  for (const mod of ITEM_MODIFIERS) {
    accumulated += mod.chance;
    if (roll <= accumulated) return mod;
  }
  return ITEM_MODIFIERS[0];
}

export function generateGeneratedItem(tierKey: TierKey) {
  const tier = TIER_CONFIG[tierKey];
  const modifier = getRandomModifier();
  
  const prefix = tier.prefixes[Math.floor(Math.random() * tier.prefixes.length)];
  const suffix = tier.suffixes[Math.floor(Math.random() * tier.suffixes.length)];
  
  let fullName = `${modifier.prefixTag}${prefix} ${suffix}`;
  
  if ("titles" in tier && tier.titles) {
    const titles = tier.titles as readonly string[];
    const title = titles[Math.floor(Math.random() * titles.length)];
    fullName += ` ${title}`;
  }

  const [minVar, maxVar] = tier.valueVariance;
  const variance = minVar + Math.random() * (maxVar - minVar);
  const calculatedValue = Math.round(tier.baseVal * variance * modifier.valueMultiplier);

  return {
    name: fullName,
    tier: tierKey,
    modifier: modifier.id,
    value: calculatedValue,
    theme: tier.theme,
    isExclusive: getExclusiveRarities().includes(tierKey),
  };
}

export { PACK_CONFIGS as PACK_METADATA };