import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  rollSmartItem,
  getPackConfig,
  TIER_ORDER,
  type SmartRollOptions,
} from "@/lib/openingEngine";

// Utility type to extract the transaction client type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const XP_BY_RARITY: Record<string, number> = {
  STARDUST: 10, NEBULA: 25, GALACTIC: 60, VOID: 150, CELESTIAL: 500, OMEGA: 2500,
};

function calcXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await req.json();
    if (typeof packId !== "string" || packId.trim() === "") {
      return NextResponse.json({ error: "Pack ID is required" }, { status: 400 });
    }

    const email = session.user.email;

    return await prisma.$transaction(async (tx: TransactionClient) => {
      const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
      const user = await tx.user.findUnique({ where: { email } });

      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const now = new Date();
      const isLuckExpired = user.luckExpiresAt ? new Date(user.luckExpiresAt).getTime() <= now.getTime() : true;
      const isDiscountExpired = user.discountExpiresAt ? new Date(user.discountExpiresAt).getTime() <= now.getTime() : true;
      const isXpExpired = user.xpBoostExpiresAt ? new Date(user.xpBoostExpiresAt).getTime() <= now.getTime() : true;

      const currentLuck = isLuckExpired ? 1.0 : (user.activeLuck ?? 1.0);
      const currentDiscount = isDiscountExpired ? 0.0 : (user.activeDiscount ?? 0);
      const xpMultiplier = isXpExpired ? 1 : 2;

      let finalPrice = pack.price;
      if (currentDiscount > 0) {
        finalPrice = Math.floor(finalPrice * (1 - currentDiscount));
      }

      if (user.balance < finalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      const packConfig = getPackConfig(pack.name);
      const rarityMod = packConfig?.rarityMod ?? 1.0;

      const smartOpts: SmartRollOptions = {
        userLuck: currentLuck,
        packRarityMod: rarityMod,
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

      const rarityKey = (wonItem.rarity || "STARDUST").toUpperCase();
      const itemXp = (XP_BY_RARITY[rarityKey] || 10) * xpMultiplier;

      let newXp = (user.xp ?? 0) + itemXp;
      let newLevel = user.level ?? 1;
      while (newXp >= calcXpForLevel(newLevel)) {
        newXp -= calcXpForLevel(newLevel);
        newLevel += 1;
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: finalPrice },
          xp: newXp,
          level: newLevel,
          activeLuck: isLuckExpired ? 1.0 : (user.activeLuck ?? 1.0),
          luckExpiresAt: isLuckExpired ? null : user.luckExpiresAt,
          activeDiscount: isDiscountExpired ? 0.0 : (user.activeDiscount ?? 0),
          discountExpiresAt: isDiscountExpired ? null : user.discountExpiresAt,
          activeXpBoost: isXpExpired ? false : (user.activeXpBoost ?? false),
          xpBoostExpiresAt: isXpExpired ? null : user.xpBoostExpiresAt,
        },
      });

      await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
      await tx.opening.create({ data: { userId: user.id, packId, itemId: wonItem.id } });

      return NextResponse.json({
        success: true,
        wonItem,
        item: wonItem,
        newBalance: updatedUser.balance,
        user: {
          balance: updatedUser.balance,
          activeLuck: updatedUser.activeLuck,
          activeDiscount: updatedUser.activeDiscount,
          activeXpBoost: updatedUser.activeXpBoost,
          luckExpiresAt: updatedUser.luckExpiresAt,
          discountExpiresAt: updatedUser.discountExpiresAt,
          xpBoostExpiresAt: updatedUser.xpBoostExpiresAt,
        }
      });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}