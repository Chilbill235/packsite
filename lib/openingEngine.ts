import { Item } from "@prisma/client";
import crypto from "crypto";

export function rollItem(items: Item[]): Item {
  if (items.length === 0) throw new Error("No items found in this pack.");

  const totalWeight = items.reduce((sum, item) => sum + item.chance, 0);
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0) / 0xffffffff;
  let target = randomNumber * totalWeight;

  for (const item of items) {
    target -= item.chance;
    if (target <= 0) return item;
  }
  return items[items.length - 1];
}