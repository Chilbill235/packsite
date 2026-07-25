import crypto from "crypto";

import type { Item } from "@prisma/client";
import {
  TIER_CONFIG,
  TIER_ORDER,
  PACK_CONFIGS,
  type TierKey,
  getPackConfig,
  getExclusiveRarities,
  toTierKey,
} from "./packConfig";

export type { TierKey } from "./packConfig";

export interface WeightedItem extends Item {
  adjustedChance: number;
}

export interface RollEngineOptions {
  userLuck?: number;
  packRarityMod?: number;
}

export interface SmartRollOptions extends RollEngineOptions {
  minRarity?: TierKey;
  guaranteedRarity?: TierKey;
  guaranteedEvery?: number;
  pityCount?: number;
  allowedRarities?: TierKey[];
}

// --- HELPERS ---

export function getCryptoRandom(): number {
  return crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
}

function parseNumeric(val: unknown, fallback = 0): number {
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

// Deterministic naming: same item ID + rarity always yields the same name.
function resolveItemName(item: Item): string {
  const isGeneric =
    !item.name || item.name.trim().toLowerCase() === "item" || item.name.trim() === "";
  return isGeneric ? deterministicName(item.id, item.rarity) : item.name;
}

function deterministicName(itemId: string, rarity: string | undefined): string {
  const hash = crypto.createHash("sha256").update(`${itemId}:${rarity}`).digest("hex");
  const short = parseInt(hash.slice(0, 8), 16);
  const tierKey = toTierKey(rarity);
  const config = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;
  const prefix = config.prefixes[short % config.prefixes.length];
  const suffix = config.suffixes[(short >> 4) % config.suffixes.length];
  return `${prefix} ${suffix}`;
}

function resolveItemValue(item: Item, packRarityMod: number): number {
  const tierKey = toTierKey(item.rarity);
  const config = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;
  const base = parseNumeric(item.value, config.baseVal);
  return Math.floor(base * Math.max(0.5, packRarityMod));
}

// --- CORE ROLLING ENGINE ---

/**
 * Calculates drop weights per item, factoring in base DB chances, active luck,
 * and the specific pack's rarity modifier.
 */
export function calculateWeightedItems(items: Item[], options: RollEngineOptions = {}): WeightedItem[] {
  const { userLuck = 1.0, packRarityMod = 1.0 } = options;
  const combined = Math.max(0.1, userLuck * packRarityMod);

  return items.map((item) => {
    const tierKey = toTierKey(item.rarity);
    const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.STARDUST;
    const baseChance = parseNumeric(item.chance, tierConfig.chance);
    const sensitivity = TIER_LUCK_SENSITIVITY[tierKey] ?? 1.0;
    const adjusted = Math.max(0.0001, baseChance * Math.pow(combined, sensitivity));

    return { ...item, adjustedChance: adjusted };
  });
}

const TIER_LUCK_SENSITIVITY: Record<TierKey, number> = {
  STARDUST: 0.5,
  NEBULA: 1.0,
  GALACTIC: 1.5,
  VOID: 2.2,
  CELESTIAL: 3.2,
  OMEGA: 4.5,
};

/**
 * Classic single-item roll without grouping filters. Kept for backwards-compatibility.
 */
export function rollItem(items: Item[], options: RollEngineOptions = {}): Item {
  if (!items || items.length === 0) {
    throw new Error("Cannot open pack: Loot pool is empty.");
  }

  const weighted = calculateWeightedItems(items, options);
  const totalWeight = weighted.reduce((sum, i) => sum + i.adjustedChance, 0);
  let target = getCryptoRandom() * totalWeight;
  let selected: WeightedItem = weighted[weighted.length - 1];

  for (const item of weighted) {
    target -= item.adjustedChance;
    if (target <= 0) {
      selected = item;
      break;
    }
  }

  return {
    ...selected,
    name: resolveItemName(selected),
    value: resolveItemValue(selected, options.packRarityMod ?? 1),
  } as Item;
}

/**
 * Smarter pack-aware roll:
 * - Filters by allowedRarities / minRarity
 * - Enforces hard pity after guaranteedEvery low rolls
 * - Applies packRarityMod to item values
 */
export function rollSmartItem(items: Item[], options: SmartRollOptions = {}): Item {
  if (!items || items.length === 0) {
    throw new Error("Cannot open pack: Loot pool is empty.");
  }

  const {
    allowedRarities,
    minRarity,
    guaranteedRarity,
    guaranteedEvery = Infinity,
    pityCount = 0,
    ...rollOpts
  } = options;

  let pool = items;
  if (allowedRarities && allowedRarities.length > 0) {
    pool = pool.filter((it) => allowedRarities.includes(toTierKey(it.rarity)));
  }
  if (pool.length === 0) pool = items;

  if (minRarity) {
    const minOrder = TIER_ORDER[minRarity] || 1;
    pool = pool.filter((it) => (TIER_ORDER[toTierKey(it.rarity)] || 0) >= minOrder);
  }
  if (pool.length === 0) pool = items;

  let targetPool = pool;
  if (guaranteedRarity && pityCount >= guaranteedEvery) {
    const gPool = pool.filter((it) => toTierKey(it.rarity) === guaranteedRarity);
    if (gPool.length > 0) {
      targetPool = gPool;
    }
  }

  const weighted = calculateWeightedItems(targetPool, rollOpts);
  const totalWeight = weighted.reduce((sum, i) => sum + i.adjustedChance, 0);
  let target = getCryptoRandom() * totalWeight;
  let selected: WeightedItem = weighted[weighted.length - 1];

  for (const item of weighted) {
    target -= item.adjustedChance;
    if (target <= 0) {
      selected = item;
      break;
    }
  }

  return {
    ...selected,
    name: resolveItemName(selected),
    value: resolveItemValue(selected, rollOpts.packRarityMod ?? 1),
  } as Item;
}

/**
 * Rolls multiple varied items for a single pack opening.
 * Automatically groups items by tier and guarantees variety.
 */
export function rollPackItems(
  items: Item[],
  count: number,
  options: SmartRollOptions = {}
): Item[] {
  const safeCount = Math.max(1, Math.min(50, Math.floor(count)));
  const results: Item[] = [];

  let consecutiveLow = options.pityCount ?? 0;
  let consecutiveHigh = 0;

  for (let i = 0; i < safeCount; i++) {
    const roll = rollSmartItem(items, { ...options, pityCount: consecutiveLow });
    results.push(roll);

    const tier = toTierKey(roll.rarity);
    const targetHigh = options.guaranteedRarity || tier;
    const highOrder = TIER_ORDER[targetHigh] || 6;
    const rollOrder = TIER_ORDER[tier] || 1;

    if (rollOrder >= highOrder) {
      consecutiveLow = 0;
      consecutiveHigh += 1;
    } else {
      consecutiveLow += 1;
      consecutiveHigh = 0;
    }
  }

  return results;
}

/**
 * Calculates packet drop percentages for frontend odds UI.
 */
export function getPackOdds(
  items: Item[],
  options: RollEngineOptions = {}
): Array<{ item: Item; percentage: number }> {
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

/** Legacy helper kept for downstream imports */
export { TIER_CONFIG, PACK_CONFIGS, getPackConfig, getExclusiveRarities, toTierKey, TIER_ORDER } from "./packConfig";
