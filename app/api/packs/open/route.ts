import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  rollSmartItem,
  getPackConfig,
  getExclusiveRarities,
  TIER_ORDER,
  toTierKey,
  type SmartRollOptions,
} from "@/lib/openingEngine";

const XP_BY_RARITY: Record<string, number> = {
  STARDUST: 10,
  NEBULA: 25,
  GALACTIC: 60,
  VOID: 150,
  CELESTIAL: 500,
  OMEGA: 2500,
};

function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Validate session user ID and email
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { packId, quantity, isFlashSale } = body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const result = await prisma.$transaction(async (tx) => {
      // Query by user ID instead of email for better accuracy and speed
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error("User profile not found.");

      const now = new Date();
      const isLuckActive = Boolean(
        user.luckExpiresAt && new Date(user.luckExpiresAt) > now
      );
      const isDiscountActive = Boolean(
        user.discountExpiresAt && new Date(user.discountExpiresAt) > now
      );
      const isXpBoostActive =
        user.activeXpBoost ||
        (user.xpBoostExpiresAt && new Date(user.xpBoostExpiresAt) > now);

      const currentLuck = isLuckActive ? (user.activeLuck ?? 1.0) : 1.0;
      const currentDiscount = isDiscountActive
        ? user.activeDiscount ?? 0
        : 0;
      const xpMultiplier = isXpBoostActive ? 2 : 1;

      let basePrice = 0;
      const isExclusive = packId === "exclusive_vault_pack";

      if (!isExclusive) {
        const pack = await tx.pack.findUnique({ where: { id: packId } });
        if (!pack) throw new Error("Pack configuration not found.");
        basePrice = pack.price;
      } else if (!user.hasExclusivePack) {
        throw new Error("No exclusive drop packs available to claim.");
      }

      let discountMultiplier = 1;
      if (!isExclusive) {
        if (isFlashSale) discountMultiplier = 0.5;
        else if (currentDiscount > 0) discountMultiplier = 1 - currentDiscount;
      }

      const finalUnitPrice = Math.floor(basePrice * discountMultiplier);
      const totalCost = finalUnitPrice * qty;

      if (user.balance < totalCost) {
        throw new Error("Insufficient balance for this purchase.");
      }

      let availableItems: any[] = [];
      let rarityMod = 1.0;
      let packConfig: ReturnType<typeof getPackConfig> | undefined;

      if (isExclusive) {
        availableItems = await tx.item.findMany({
          where: { rarity: { in: getExclusiveRarities() } },
        });
        rarityMod = 2.0;
      } else {
        availableItems = await tx.item.findMany({
          where: { packId: packId },
        });

        if (availableItems.length === 0) {
          throw new Error(
            "No items found for this pack. Ensure database is seeded."
          );
        }

        const pack = await tx.pack.findUnique({ where: { id: packId } });
        packConfig = pack ? getPackConfig(pack.name) : undefined;
        rarityMod = packConfig?.rarityMod ?? 1.0;
      }

      let totalXpGained = 0;
      const wonItems: { name: string; rarity: string; value: number }[] = [];
      const openingsData: { userId: string; packId: string; itemId: string }[] = [];
      const inventoryData: { userId: string; itemId: string }[] = [];

      let guaranteedLowRolls = 0;

      for (let i = 0; i < qty; i++) {
        const smartOpts: SmartRollOptions = {
          userLuck: currentLuck,
          packRarityMod: rarityMod,
          pityCount: guaranteedLowRolls,
        };

        if (!isExclusive && packConfig) {
          smartOpts.minRarity = packConfig.minRarity;
          smartOpts.allowedRarities = packConfig.allowedRarities;
          if (packConfig.guaranteedRarity) {
            smartOpts.guaranteedRarity = packConfig.guaranteedRarity;
            smartOpts.guaranteedEvery = packConfig.guaranteedEvery;
          }
        }

        const rolled = rollSmartItem(availableItems, smartOpts);

        const rarityKey = (rolled.rarity || "STARDUST").toUpperCase();
        const itemXp = (XP_BY_RARITY[rarityKey] || 10) * xpMultiplier;
        totalXpGained += itemXp;

        if (packConfig?.guaranteedRarity) {
          const guaranteedOrder = TIER_ORDER[packConfig.guaranteedRarity] || 6;
          const rollOrder = TIER_ORDER[toTierKey(rarityKey)] || 0;
          if (rollOrder < guaranteedOrder) {
            guaranteedLowRolls += 1;
          } else {
            guaranteedLowRolls = 0;
          }
        }

        wonItems.push({
          name: rolled.name,
          rarity: rolled.rarity,
          value: rolled.value,
        });

        openingsData.push({
          userId: user.id,
          packId: isExclusive ? rolled.packId : packId,
          itemId: rolled.id,
        });

        inventoryData.push({
          userId: user.id,
          itemId: rolled.id,
        });
      }

      let newXp = (user.xp ?? 0) + totalXpGained;
      let newLevel = user.level ?? 1;

      while (newXp >= getXpForLevel(newLevel)) {
        newXp -= getXpForLevel(newLevel);
        newLevel += 1;
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: user.balance - totalCost,
          xp: newXp,
          level: newLevel,
          hasExclusivePack: isExclusive ? false : (user.hasExclusivePack ?? false),
          activeLuck: isLuckActive ? (user.activeLuck ?? 1.0) : 1.0,
          luckExpiresAt: isLuckActive ? user.luckExpiresAt : null,
          activeDiscount: isDiscountActive ? (user.activeDiscount ?? 0) : 0,
          discountExpiresAt: isDiscountActive ? user.discountExpiresAt : null,
          activeXpBoost: Boolean(isXpBoostActive),
          xpBoostExpiresAt: Boolean(isXpBoostActive) ? user.xpBoostExpiresAt : null,
        },
      });

      if (openingsData.length > 0) {
        await tx.opening.createMany({ data: openingsData });
      }

      if (inventoryData.length > 0) {
        await tx.inventory.createMany({ data: inventoryData });
      }

      return {
        newBalance: updatedUser.balance,
        wonItems,
        user: updatedUser,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error in /api/packs/open:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}