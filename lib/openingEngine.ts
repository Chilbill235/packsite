import { Item } from "@prisma/client";
import crypto from "crypto";

// Adjusts the impact of luck on different rarities
const RARITY_MULTIPLIERS: Record<string, number> = {
  'Common': 1.0,
  'Rare': 1.2,
  'Legendary': 1.5,
  'Mythical': 2.0
};

export function rollItem(items: Item[], luck: number = 1.0): Item {
  if (items.length === 0) throw new Error("No items found in this pack.");

  // Calculate weighted chances based on luck
  const weightedItems = items.map(item => ({
    ...item,
    adjustedChance: (Number(item.chance) || 1) * (1 + (luck - 1) * (RARITY_MULTIPLIERS[item.rarity] || 1))
  }));

  const totalWeight = weightedItems.reduce((sum, item) => sum + item.adjustedChance, 0);
  
  // Cryptographic random number between 0 and 1
  const random = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  let target = random * totalWeight;

  for (const item of weightedItems) {
    target -= item.adjustedChance;
    if (target <= 0) return item;
  }
  
  return weightedItems[weightedItems.length - 1];
}