"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  rollSmartItem,
  getPackConfig,
  type SmartRollOptions,
} from "@/lib/openingEngine";

// Utility type to extract the transaction client type directly from the prisma instance
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function openPack(packId: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  return await prisma.$transaction(async (tx: TransactionClient) => {
    const user = await tx.user.findUnique({ where: { email } });
    const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });

    if (!pack) throw new Error("Pack not found");
    if (!user || user.balance < pack.price) throw new Error("Insufficient balance");

    const packConfig = getPackConfig(pack.name);
    const smartOpts: SmartRollOptions = {
      userLuck: 1.0,
      packRarityMod: packConfig?.rarityMod ?? 1.0,
    };
    if (packConfig) {
      smartOpts.minRarity = packConfig.minRarity;
      smartOpts.allowedRarities = packConfig.allowedRarities;
      if (packConfig.guaranteedRarity) {
        smartOpts.guaranteedRarity = packConfig.guaranteedRarity;
        smartOpts.guaranteedEvery = packConfig.guaranteedEvery;
      }
    }

    const wonItem = rollSmartItem(pack.items, smartOpts);
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: pack.price } },
    });

    await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
    await tx.opening.create({ data: { userId: user.id, packId: pack.id, itemId: wonItem.id } });

    return { wonItem, newBalance: updatedUser.balance };
  });
}

export async function sellItem(inventoryId: string) {
  if (!inventoryId) {
    throw new Error("Invalid inventory ID");
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const inventory = await prisma.inventory.findFirst({
    where: {
      id: inventoryId,
      user: { email },
    },
    include: { item: true },
  });

  if (!inventory) throw new Error("Item not found in your inventory");

  return await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.inventory.delete({ where: { id: inventoryId } });
    const updatedUser = await tx.user.update({
      where: { id: inventory.userId },
      data: { balance: { increment: inventory.item.value } },
    });

    return { newBalance: updatedUser.balance };
  });
}

/**
 * Handles updating user customization and preference states (themes, notifications, privacy toggles)
 * directly aligned with your PostgreSQL Prisma schema fields.
 */
export async function updateUserSettings(data: {
  theme?: string;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  showInventory?: boolean;
  showBalance?: boolean;
  showActivity?: boolean;
  publicProfile?: boolean;
  bio?: string;
  location?: string;
  username?: string;
}) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    throw new Error("Unauthorized request");
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data,
  });

  revalidatePath("/profile");
  revalidatePath("/settings");

  return { success: true, user: updatedUser };
}