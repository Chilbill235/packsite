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
// PACK CONFIGURATIONS (PROGRESSIVE TIERS WITH UNIQUE TIER TAGS)
// ============================================================================

export interface PackDropRates {
  tier: TierKey;
  chancePercentage: number;
}

export interface PackConfig {
  id: string;
  name: string;
  tagline: string;
  cat: "Standard" | "Premium" | "Mythic" | "Exotic" | "Limited Event" | "High Roller" | "God Tier";
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
    tierTag: "COMMON",
    tierColor: "bg-gray-800 text-gray-300 border-gray-600",
    price: 100,
    cardsPerPack: 3,
    rarityMod: 1.0,
    allowedRarities: ["STARDUST", "NEBULA"],
    minRarity: "STARDUST",
    guaranteedEvery: 10,
    desc: "Full of literal junk, soggy cardboard, and loose wire scraps.",
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
    tagline: "Salvaged hardware",
    cat: "Standard",
    tierTag: "UNCOMMON",
    tierColor: "bg-sky-950 text-sky-300 border-sky-600",
    price: 500,
    cardsPerPack: 3,
    rarityMod: 1.2,
    allowedRarities: ["STARDUST", "NEBULA", "QUANTUM", "GALACTIC"],
    minRarity: "STARDUST",
    guaranteedRarity: "NEBULA",
    guaranteedEvery: 5,
    desc: "Salvaged microchips, copper wiring, and mid-grade tech.",
    dropRates: [
      { tier: "STARDUST", chancePercentage: 55.0 },
      { tier: "NEBULA", chancePercentage: 32.0 },
      { tier: "QUANTUM", chancePercentage: 10.5 },
      { tier: "GALACTIC", chancePercentage: 2.5 },
    ],
    visuals: {
      gradient: "from-sky-950 via-slate-900 to-indigo-950",
      accentColor: "#38bdf8",
      glowColor: "rgba(56, 189, 248, 0.3)",
    },
  },
  {
    id: "void-walkers-trove",
    name: "Void Walker's Trove",
    tagline: "Combat & Cybernetics",
    cat: "Premium",
    badgeText: "POPULAR",
    tierTag: "RARE",
    tierColor: "bg-emerald-950 text-emerald-300 border-emerald-600",
    price: 2500,
    cardsPerPack: 4,
    rarityMod: 1.5,
    allowedRarities: ["NEBULA", "QUANTUM", "GALACTIC", "VOID"],
    minRarity: "NEBULA",
    guaranteedRarity: "GALACTIC",
    guaranteedEvery: 8,
    desc: "Overclocked neural drives and sub-zero cybernetic implants.",
    dropRates: [
      { tier: "NEBULA", chancePercentage: 48.0 },
      { tier: "QUANTUM", chancePercentage: 34.0 },
      { tier: "GALACTIC", chancePercentage: 15.0 },
      { tier: "VOID", chancePercentage: 3.0 },
    ],
    visuals: {
      gradient: "from-purple-950 via-zinc-950 to-pink-950",
      accentColor: "#22c55e",
      glowColor: "rgba(34, 197, 94, 0.35)",
    },
  },
  {
    id: "chronos-event-crate",
    name: "Chronos Lockbox",
    tagline: "War-grade weaponry",
    cat: "Limited Event",
    badgeText: "LIMITED",
    tierTag: "EPIC",
    tierColor: "bg-purple-950 text-purple-300 border-purple-600",
    price: 10000,
    cardsPerPack: 5,
    rarityMod: 2.0,
    allowedRarities: ["QUANTUM", "GALACTIC", "VOID", "CELESTIAL"],
    minRarity: "QUANTUM",
    guaranteedRarity: "GALACTIC",
    guaranteedEvery: 6,
    desc: "Supercharged plasma weaponry and titanium-forged coilguns.",
    dropRates: [
      { tier: "QUANTUM", chancePercentage: 40.0 },
      { tier: "GALACTIC", chancePercentage: 42.0 },
      { tier: "VOID", chancePercentage: 14.0 },
      { tier: "CELESTIAL", chancePercentage: 4.0 },
    ],
    visuals: {
      gradient: "from-purple-950 via-teal-950 to-black",
      accentColor: "#a855f7",
      glowColor: "rgba(168, 85, 247, 0.4)",
    },
  },
  {
    id: "celestial-vault",
    name: "Celestial Vault",
    tagline: "Forbidden Abyssal Gear",
    cat: "Premium",
    tierTag: "MYTHIC",
    tierColor: "bg-pink-950 text-pink-300 border-pink-600",
    price: 50000,
    cardsPerPack: 4,
    rarityMod: 2.8,
    allowedRarities: ["GALACTIC", "VOID", "CELESTIAL", "SINGULARITY"],
    minRarity: "GALACTIC",
    guaranteedRarity: "VOID",
    guaranteedEvery: 10,
    desc: "Forbidden dark matter scythes and soul-stealing abyssal reapers.",
    dropRates: [
      { tier: "GALACTIC", chancePercentage: 50.0 },
      { tier: "VOID", chancePercentage: 35.0 },
      { tier: "CELESTIAL", chancePercentage: 13.5 },
      { tier: "SINGULARITY", chancePercentage: 1.5 },
    ],
    visuals: {
      gradient: "from-pink-950 via-purple-950 to-slate-950",
      accentColor: "#ec4899",
      glowColor: "rgba(236, 72, 153, 0.45)",
    },
  },
  {
    id: "high-roller-casino-vault",
    name: "High Roller's Casino Vault",
    tagline: "Divine God-Tier Relics",
    cat: "High Roller",
    badgeText: "CASINO",
    tierTag: "LEGENDARY",
    tierColor: "bg-amber-950 text-amber-300 border-amber-500",
    price: 1000000,
    cardsPerPack: 5,
    rarityMod: 4.0,
    allowedRarities: ["VOID", "CELESTIAL", "SINGULARITY", "OMEGA", "ABSOLUTE_ZERO"],
    minRarity: "VOID",
    guaranteedRarity: "CELESTIAL",
    guaranteedEvery: 5,
    desc: "Sun-forged aegis shields and radiant divine scepters.",
    dropRates: [
      { tier: "VOID", chancePercentage: 45.0 },
      { tier: "CELESTIAL", chancePercentage: 35.0 },
      { tier: "SINGULARITY", chancePercentage: 15.0 },
      { tier: "OMEGA", chancePercentage: 4.5 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 0.5 },
    ],
    visuals: {
      gradient: "from-yellow-700 via-amber-950 to-black",
      accentColor: "#f59e0b",
      glowColor: "rgba(245, 158, 11, 0.5)",
    },
  },
  {
    id: "black-market-shipment",
    name: "Black Market Smuggler Ship",
    tagline: "Space-warping artifacts",
    cat: "Exotic",
    badgeText: "ILLEGAL",
    tierTag: "EXOTIC",
    tierColor: "bg-cyan-950 text-cyan-300 border-cyan-400",
    price: 25000000,
    cardsPerPack: 6,
    rarityMod: 5.5,
    allowedRarities: ["CELESTIAL", "SINGULARITY", "OMEGA", "ABSOLUTE_ZERO", "DIVINE_ARCHON"],
    minRarity: "CELESTIAL",
    guaranteedRarity: "SINGULARITY",
    guaranteedEvery: 4,
    desc: "Dimension-splitting paradox blades and time-warped engines.",
    dropRates: [
      { tier: "CELESTIAL", chancePercentage: 40.0 },
      { tier: "SINGULARITY", chancePercentage: 38.0 },
      { tier: "OMEGA", chancePercentage: 15.0 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 6.5 },
      { tier: "DIVINE_ARCHON", chancePercentage: 0.5 },
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
    tagline: "Doomsday war machines",
    cat: "Mythic",
    badgeText: "ENDGAME",
    tierTag: "OMEGA",
    tierColor: "bg-red-950 text-red-300 border-red-500 font-bold",
    price: 100000000,
    cardsPerPack: 5,
    rarityMod: 7.0,
    allowedRarities: ["SINGULARITY", "OMEGA", "ABSOLUTE_ZERO", "DIVINE_ARCHON", "ETERNITY"],
    minRarity: "SINGULARITY",
    guaranteedRarity: "OMEGA",
    guaranteedEvery: 10,
    desc: "God-killer annihilator cannons and world-breaking war engines.",
    dropRates: [
      { tier: "SINGULARITY", chancePercentage: 50.0 },
      { tier: "OMEGA", chancePercentage: 30.0 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 14.0 },
      { tier: "DIVINE_ARCHON", chancePercentage: 5.8 },
      { tier: "ETERNITY", chancePercentage: 0.2 },
    ],
    visuals: {
      gradient: "from-red-950 via-rose-950 to-black",
      accentColor: "#ef4444",
      glowColor: "rgba(239, 68, 68, 0.8)",
    },
  },
  {
    id: "reality-collapse-catalyst",
    name: "Reality Collapse Catalyst",
    tagline: "Multiverse-erasing authority",
    cat: "God Tier",
    badgeText: "GOD TIER",
    tierTag: "TRANSCENDENT",
    tierColor: "bg-white text-black font-black border-purple-500",
    price: 1000000000,
    cardsPerPack: 7,
    rarityMod: 12.0,
    allowedRarities: ["OMEGA", "ABSOLUTE_ZERO", "DIVINE_ARCHON", "ETERNITY", "TRANSCENDENT_OVERLORD"],
    minRarity: "OMEGA",
    guaranteedRarity: "ABSOLUTE_ZERO",
    guaranteedEvery: 3,
    desc: "Direct access to the Creator of All, Developer Mode, and Multiverse Erasers.",
    dropRates: [
      { tier: "OMEGA", chancePercentage: 40.0 },
      { tier: "ABSOLUTE_ZERO", chancePercentage: 35.0 },
      { tier: "DIVINE_ARCHON", chancePercentage: 18.0 },
      { tier: "ETERNITY", chancePercentage: 6.9 },
      { tier: "TRANSCENDENT_OVERLORD", chancePercentage: 0.1 },
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