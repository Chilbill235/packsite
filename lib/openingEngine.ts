import { Item } from "@prisma/client";
import crypto from "crypto";

// --- CONFIGURATIONS & METADATA ---

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

export const PACK_METADATA = [
  {
    name: "Wayfarer’s Launch Kit",
    price: 100,
    desc: "Standard-issue logistics cache containing basic survival essentials, low-orbit scrap, and foundational crafting components.",
    cat: "BASIC",
    rarityMod: 1.0,
  },
  {
    name: "Vanguard Supply Drop",
    price: 0,
    desc: "A subsidized daily manifest distributed by Sector Command. Minimal but reliable materials to keep your thrusters warm.",
    cat: "PROMO",
    rarityMod: 1.1,
  },
  {
    name: "Nova-Class Cache",
    price: 600,
    desc: "Highly volatile cargo intercepted from a localized stellar collapse. Packed with time-sensitive cosmic anomalies.",
    cat: "EVENT",
    rarityMod: 1.3,
  },
  {
    name: "Empyrean Archival Vault",
    price: 1500,
    desc: "A heavily shielded high-tier vault containing dense starlight matrices, pristine galactic alloys, and pre-collapse relics.",
    cat: "PREMIUM",
    rarityMod: 1.6,
  },
  {
    name: "Singularity Containment Unit",
    price: 3500,
    desc: "Sealed with dense magnetic dampeners to trap hyper-unstable null-space energy, zero-point vectors, and raw void shards.",
    cat: "VOID",
    rarityMod: 2.5,
  },
  {
    name: "Paradox Core Consignment",
    price: 12000,
    desc: "Strictly black-market cargo banned across civilized sectors. Guaranteed to cause micro-tears in local spacetime upon opening.",
    cat: "OMEGA",
    rarityMod: 4.5,
  },
] as const;

// Sensitivity exponents controlling how luck/pack mods scale each rarity tier
const TIER_LUCK_SENSITIVITY: Record<TierKey, number> = {
  STARDUST: 0.5,    // Base chance shrinks as luck/pack tier increases
  NEBULA: 1.0,
  GALACTIC: 1.5,
  VOID: 2.2,
  CELESTIAL: 3.2,
  OMEGA: 4.5,       // Heavily boosted by high-tier packs & active luck
};

export interface WeightedItem extends Item {
  adjustedChance: number;
}

export interface RollEngineOptions {
  userLuck?: number;        // Active user luck multiplier (e.g. 1.0, 1.5, 2.0)
  packRarityMod?: number;   // Pack rarity modifier from PACK_METADATA (e.g. 1.0 to 4.5)
}

// --- HELPER UTILITIES ---

/**
 * Returns a cryptographically secure random float between 0 (inclusive) and 1 (exclusive).
 */
export function getCryptoRandom(): number {
  return crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
}

/**
 * Parses Prisma Decimal, String, or Float fields safely into a standard JS number.
 */
function parseNumeric(val: unknown, fallback: number = 0): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const p = parseFloat(val);
    return isNaN(p) ? fallback : p;
  }
  if (val && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return fallback;
}

/**
 * Generates a pro-tier sci-fi item name dynamically from TIER_CONFIG prefix + suffix matrix.
 */
export function generateProceduralItemName(rarity: string): string {
  const tierKey = (rarity || "STARDUST").toUpperCase() as TierKey;
  const config = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;

  const prefix = config.prefixes[Math.floor(getCryptoRandom() * config.prefixes.length)];
  const suffix = config.suffixes[Math.floor(getCryptoRandom() * config.suffixes.length)];

  return `${prefix} ${suffix}`;
}

// --- CORE UNBOXING ENGINE ---

/**
 * Calculates drop probabilities per item, factoring in base chances, active user luck,
 * and the specific pack's rarity modifier.
 */
export function calculateWeightedItems(items: Item[], options: RollEngineOptions = {}): WeightedItem[] {
  const { userLuck = 1.0, packRarityMod = 1.0 } = options;
  const combinedMultiplier = Math.max(0.1, userLuck * packRarityMod);

  return items.map((item) => {
    const tierKey = (item.rarity || "STARDUST").toUpperCase() as TierKey;
    const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;

    // Use DB item chance, falling back to standard TIER_CONFIG chance
    const baseChance = parseNumeric(item.chance, tierConfig.chance);
    const sensitivity = TIER_LUCK_SENSITIVITY[tierKey] ?? 1.0;

    // Formula: baseChance * (combinedMultiplier ^ sensitivity)
    const adjustedChance = Math.max(0.0001, baseChance * Math.pow(combinedMultiplier, sensitivity));

    return {
      ...item,
      adjustedChance,
    };
  });
}

/**
 * Executes a single weighted cryptographic item roll from an available pool.
 * Automatically handles dynamic procedural naming and value assignments.
 */
export function rollItem(items: Item[], options: RollEngineOptions = {}): Item {
  if (!items || items.length === 0) {
    throw new Error("Cannot open pack: Loot pool is empty.");
  }

  const weightedItems = calculateWeightedItems(items, options);
  const totalWeight = weightedItems.reduce((sum, item) => sum + item.adjustedChance, 0);

  let target = getCryptoRandom() * totalWeight;
  let selectedItem: WeightedItem = weightedItems[weightedItems.length - 1];

  for (const item of weightedItems) {
    target -= item.adjustedChance;
    if (target <= 0) {
      selectedItem = item;
      break;
    }
  }

  const { adjustedChance, ...cleanItem } = selectedItem;
  const tierKey = (cleanItem.rarity || "STARDUST").toUpperCase() as TierKey;
  const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;

  // Resolve item name: keep custom seed names, or generate procedural name if generic
  const isGeneric = !cleanItem.name || cleanItem.name.toLowerCase().includes("item") || cleanItem.name.includes("#");
  const finalName = isGeneric ? generateProceduralItemName(cleanItem.rarity) : cleanItem.name;

  return {
    ...cleanItem,
    name: finalName,
    value: parseNumeric(cleanItem.value, tierConfig.baseVal),
  } as Item;
}

/**
 * Rolls multiple items for bulk pack opening (e.g., 5x, 10x, 50x opens).
 */
export function rollBulkItems(items: Item[], quantity: number = 1, options: RollEngineOptions = {}): Item[] {
  const safeQty = Math.max(1, Math.min(100, Math.floor(quantity)));
  const results: Item[] = [];

  for (let i = 0; i < safeQty; i++) {
    results.push(rollItem(items, options));
  }

  return results;
}

/**
 * Calculates item drop percentages for frontend pack odds UI popups.
 */
export function getPackOdds(items: Item[], options: RollEngineOptions = {}): Array<{ item: Item; percentage: number }> {
  const weighted = calculateWeightedItems(items, options);
  const totalWeight = weighted.reduce((sum, i) => sum + i.adjustedChance, 0);

  return weighted.map((wItem) => {
    const { adjustedChance, ...originalItem } = wItem;
    const percentage = totalWeight > 0 ? (adjustedChance / totalWeight) * 100 : 0;

    return {
      item: originalItem as Item,
      percentage: Number(percentage.toFixed(3)),
    };
  });
}