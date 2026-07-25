export const TIER_CONFIG = {
  STARDUST: {
    qty: 150,
    baseVal: 10,
    chance: 10000,
    prefixes: ["Stray", "Astral", "Faded", "Dormant", "Drifting", "Fractured", "Static", "Residual", "Glinting", "Vagrant"],
    suffixes: ["Ember", "Glimmer", "Shard", "Mote", "Speck", "Scrap", "Trace", "Remnant", "Flux", "Dust"],
  },
  NEBULA: {
    qty: 75,
    baseVal: 150,
    chance: 4000,
    prefixes: ["Ionized", "Prismatic", "Luminescent", "Kinetic", "Thermal", "Vibrant", "Nebulous", "Aura-Bound", "Solaris", "Fluorescent"],
    suffixes: ["Filament", "Bloom", "Cascade", "Pulse", "Veil", "Vapor", "Plasma", "Condensate", "Helix", "Mist"],
  },
  GALACTIC: {
    qty: 30,
    baseVal: 1200,
    chance: 1200,
    prefixes: ["Magnetar", "Supermassive", "Hyper-Dense", "Orbital", "Gravitic", "Quasar", "Tectonic", "Chronal", "Stellar-Forged", "Cosmic"],
    suffixes: ["Core", "Lattice", "Matrix", "Monolith", "Conduit", "Node", "Ingot", "Weave", "Catalyst", "Anchor"],
  },
  VOID: {
    qty: 10,
    baseVal: 25000,
    chance: 150,
    prefixes: ["Abyssal", "Zero-Point", "Umbral", "Vantablack", "Eldritch", "Null-Space", "Event-Horizon", "Shattered", "Eclipse", "Sub-Spatial"],
    suffixes: ["Rift", "Singularity", "Maw", "Fracture", "Vacuum", "Phantom", "Horizon", "Obelisk", "Gaze", "Blade"],
  },
  CELESTIAL: {
    qty: 2,
    baseVal: 750000,
    chance: 15,
    prefixes: ["Primordial", "Ascended", "Sovereign", "Archon", "Timeless", "Empyrean", "Infinite", "Genesis", "Aeon", "Divine"],
    suffixes: ["Apex", "Aegis", "Reliquary", "Crown", "Will", "Sphere", "Engine", "Soul", "Artifact", "Beacon"],
  },
  OMEGA: {
    qty: 1,
    baseVal: 50000000,
    chance: 2,
    prefixes: ["REALITY-RENDING", "CAUSALITY-BREAKING", "DOOMSDAY", "OMEGA-PROTOCOL", "UNBOUND-TITAN", "GOD-KILLER", "EXISTENTIAL-ZERO", "CHRONO-COLLAPSED"],
    suffixes: ["Paradox", "Catalyst", "Nexus", "Anomaly", "Ultimatum", "Ouroboros", "Crucible", "Origin", "Engine", "Singularity"],
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;

export const TIER_ORDER: Record<TierKey, number> = {
  STARDUST: 1,
  NEBULA: 2,
  GALACTIC: 3,
  VOID: 4,
  CELESTIAL: 5,
  OMEGA: 6,
};

export interface PackConfig {
  name: string;
  cat: string;
  rarityMod: number;
  allowedRarities: TierKey[];
  minRarity: TierKey;
  guaranteedRarity?: TierKey;
  guaranteedEvery: number;
  desc: string;
  price: number;
}

export const PACK_CONFIGS: PackConfig[] = [
  {
    name: "Wayfarer's Cache",
    cat: "Standard",
    rarityMod: 1.0,
    allowedRarities: ["STARDUST", "NEBULA"],
    minRarity: "STARDUST",
    guaranteedEvery: 10,
    desc: "A basic supply crate containing essential materials.",
    price: 100,
  },
  {
    name: "Astral Nexus",
    cat: "Standard",
    rarityMod: 1.2,
    allowedRarities: ["STARDUST", "NEBULA", "GALACTIC"],
    minRarity: "STARDUST",
    guaranteedRarity: "NEBULA",
    guaranteedEvery: 5,
    desc: "A gateway to the stars with improved cosmic rewards.",
    price: 500,
  },
  {
    name: "Void Walker's Trove",
    cat: "Premium",
    rarityMod: 1.5,
    allowedRarities: ["NEBULA", "GALACTIC", "VOID"],
    minRarity: "NEBULA",
    guaranteedRarity: "GALACTIC",
    guaranteedEvery: 8,
    desc: "Dare to walk the void for a chance at abyssal treasures.",
    price: 2500,
  },
  {
    name: "Celestial Vault",
    cat: "Premium",
    rarityMod: 2.0,
    allowedRarities: ["GALACTIC", "VOID", "CELESTIAL"],
    minRarity: "GALACTIC",
    guaranteedRarity: "VOID",
    guaranteedEvery: 10,
    desc: "The vault of the cosmos holds the rarest celestial artifacts.",
    price: 15000,
  },
  {
    name: "Omega Sanctum",
    cat: "Mythic",
    rarityMod: 3.0,
    allowedRarities: ["VOID", "CELESTIAL", "OMEGA"],
    minRarity: "VOID",
    guaranteedRarity: "CELESTIAL",
    guaranteedEvery: 15,
    desc: "The ultimate pack containing reality-breaking omega items.",
    price: 100000,
  },
];

/**
 * Safely converts an arbitrary string to a valid TierKey, falling back to STARDUST.
 */
export function toTierKey(rarity?: string | null): TierKey {
  if (!rarity) return "STARDUST";
  const key = rarity.toUpperCase() as TierKey;
  return key in TIER_CONFIG ? key : "STARDUST";
}

/**
 * Helper to fetch pack configuration by pack name.
 */
export function getPackConfig(name: string): PackConfig | undefined {
  return PACK_CONFIGS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Returns top-tier rarities reserved for exclusive drops.
 */
export function getExclusiveRarities(): TierKey[] {
  return ["VOID", "CELESTIAL", "OMEGA"];
}