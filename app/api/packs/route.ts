import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  rollSmartItem,
  getPackConfig,
  getExclusiveRarities,
  TIER_ORDER,
  toTierKey,
  type SmartRollOptions,
} from "@/lib/openingEngine";
import { auth } from "@/lib/auth";

// GET: Fetches available packs (without items for performance)
export async function GET() {
  try {
    const packs = await prisma.pack.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
      },
    });
    return NextResponse.json(packs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}

// POST: Handles the pack opening logic securely
export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check for user ID or fallback email to guarantee session validity
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const { packId, quantity = 1, isFlashSale = false } = await req.json();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const result = await prisma.$transaction(async (tx) => {
      // Primary lookup by ID, secondary fallback by non-null email string
      const user = userId
        ? await tx.user.findUnique({ where: { id: userId } })
        : await tx.user.findUnique({ where: { email: userEmail as string } });

      if (!user) throw new Error("User not found");

      const now = new Date();
      const isLuckExpired = user.luckExpiresAt ? new Date(user.luckExpiresAt).getTime() <= now.getTime() : true;
      const isDiscountExpired = user.discountExpiresAt ? new Date(user.discountExpiresAt).getTime() <= now.getTime() : true;
      const isXpExpired = user.xpBoostExpiresAt ? new Date(user.xpBoostExpiresAt).getTime() <= now.getTime() : true;

      const verifiedLuck = isLuckExpired ? 1.0 : (user.activeLuck ?? 1.0);
      const verifiedDiscount = isDiscountExpired ? 0.0 : (user.activeDiscount ?? 0);
      const xpMultiplier = isXpExpired ? 1 : 2;

      const isExclusive = packId === "exclusive_vault_pack";
      let availableItems: any[] = [];
      let basePrice = 0;
      let rarityMod = 1.0;
      let packConfig: ReturnType<typeof getPackConfig> | undefined;

      if (isExclusive) {
        if (!user.hasExclusivePack) throw new Error("No exclusive drop packs available to claim.");
        availableItems = await tx.item.findMany({ where: { rarity: { in: getExclusiveRarities() } } });
        rarityMod = 2.0;
      } else {
        const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
        if (!pack) throw new Error("Pack not found");
        if (!pack.items || pack.items.length === 0) throw new Error("Pack has no configured items");
        availableItems = pack.items;
        basePrice = pack.price;
        packConfig = getPackConfig(pack.name);
        rarityMod = packConfig?.rarityMod ?? 1.0;
      }

      let discountMultiplier = 1;
      if (!isExclusive) {
        if (isFlashSale) discountMultiplier = 0.5;
        else if (verifiedDiscount > 0) discountMultiplier = 1 - verifiedDiscount;
      }

      const pricePerPack = Math.floor(basePrice * discountMultiplier);
      const totalCost = pricePerPack * qty;
      if (user.balance < totalCost) throw new Error("Insufficient balance");

      const XP_BY_RARITY: Record<string, number> = {
        STARDUST: 10, NEBULA: 25, GALACTIC: 60, VOID: 150, CELESTIAL: 500, OMEGA: 2500,
      };

      const getXpForLevelLoc = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

      let totalXpGained = 0;
      let guaranteedLowRolls = 0;
      const wonItems: { name: string; rarity: string; value: number }[] = [];
      const openingsData: { userId: string; packId: string; itemId: string }[] = [];
      const inventoryData: { userId: string; itemId: string }[] = [];

      for (let i = 0; i < qty; i++) {
        const smartOpts: SmartRollOptions = {
          userLuck: verifiedLuck,
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
          if (rollOrder < guaranteedOrder) guaranteedLowRolls += 1;
          else guaranteedLowRolls = 0;
        }

        wonItems.push({ name: rolled.name, rarity: rolled.rarity, value: rolled.value });
        const targetPackId = isExclusive ? (rolled as any).packId || packId : packId;
        openingsData.push({ userId: user.id, packId: targetPackId, itemId: rolled.id });
        inventoryData.push({ userId: user.id, itemId: rolled.id });
      }

      let newXp = (user.xp ?? 0) + totalXpGained;
      let newLevel = user.level ?? 1;
      while (newXp >= getXpForLevelLoc(newLevel)) {
        newXp -= getXpForLevelLoc(newLevel);
        newLevel += 1;
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: totalCost },
          xp: newXp,
          level: newLevel,
          hasExclusivePack: isExclusive ? false : (user.hasExclusivePack ?? false),
          activeLuck: isLuckExpired ? 1.0 : (user.activeLuck ?? 1.0),
          luckExpiresAt: isLuckExpired ? null : user.luckExpiresAt,
          activeDiscount: isDiscountExpired ? 0.0 : (user.activeDiscount ?? 0),
          discountExpiresAt: isDiscountExpired ? null : user.discountExpiresAt,
          activeXpBoost: isXpExpired ? false : (user.activeXpBoost ?? false),
          xpBoostExpiresAt: isXpExpired ? null : user.xpBoostExpiresAt,
        },
      });

      if (openingsData.length > 0) await tx.opening.createMany({ data: openingsData });
      if (inventoryData.length > 0) await tx.inventory.createMany({ data: inventoryData });

      return { newBalance: updatedUser.balance, wonItems, newXp, newLevel };
    });

    return NextResponse.json({
      success: true,
      wonItems: result.wonItems,
      newBalance: result.newBalance,
      xp: result.newXp,
      level: result.newLevel,
    });

  } catch (error: unknown) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 400 }
    );
  }
}