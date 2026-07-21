import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

// Dynamic XP rewards mapped by item rarity tier
const XP_BY_RARITY: Record<string, number> = {
  STARDUST: 10,
  NEBULA: 25,
  GALACTIC: 60,
  VOID: 150,
  CELESTIAL: 500,
  OMEGA: 2500,

  COMMON: 10,
  RARE: 25,
  EPIC: 60,
  LEGENDARY: 150,
  MYTHICAL: 500,
  EXCLUSIVE: 1000,
};

function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packId, quantity, isFlashSale } = body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch User Record
        const user = await tx.user.findUnique({
          where: { email: session.user.email },
        });

        if (!user) {
          throw new Error("User profile not found.");
        }

        const now = new Date();

        // 2. Read Active Buffs & Expirations
        const isLuckActive = Boolean(user.luckExpiresAt && new Date(user.luckExpiresAt) > now);
        const isDiscountActive = Boolean(user.discountExpiresAt && new Date(user.discountExpiresAt) > now);
        const isXpBoostActive = Boolean(
          user.activeXpBoost || (user.xpBoostExpiresAt && new Date(user.xpBoostExpiresAt) > now)
        );

        const currentLuck = isLuckActive ? (user.activeLuck ?? 1.0) : 1.0;
        const currentDiscount = isDiscountActive ? (user.activeDiscount ?? 0) : 0;
        const xpMultiplier = isXpBoostActive ? 2 : 1;

        // 3. Resolve Pricing & Store Balance Check
        let basePrice = 0;
        const isExclusive = packId === "exclusive_vault_pack";

        if (!isExclusive) {
          const pack = await tx.pack.findUnique({ where: { id: packId } });
          if (!pack) {
            throw new Error("Pack configuration not found.");
          }
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

        // 4. Load available Item records for this Pack
        const availableItems = await tx.item.findMany({
          where: isExclusive ? {} : { packId: packId },
        });

        if (availableItems.length === 0) {
          throw new Error("No items found for this pack. Ensure database is seeded.");
        }

        // 5. Roll Loot Items using engine
        let totalXpGained = 0;
        const wonItems: { name: string; rarity: string; value: number }[] = [];
        const openingsData: { userId: string; packId: string; itemId: string }[] = [];
        const inventoryData: { userId: string; itemId: string }[] = [];

        for (let i = 0; i < qty; i++) {
          // Supports both object return or direct Item return from engine
          const rolled = rollItem(availableItems, currentLuck);
          const selectedItem = "item" in rolled ? (rolled as any).item : rolled;

          const rarityKey = (selectedItem.rarity || "STARDUST").toUpperCase();
          const itemXp = (XP_BY_RARITY[rarityKey] || 10) * xpMultiplier;
          totalXpGained += itemXp;

          wonItems.push({
            name: selectedItem.name,
            rarity: selectedItem.rarity,
            value: selectedItem.value,
          });

          openingsData.push({
            userId: user.id,
            packId: isExclusive ? selectedItem.packId : packId,
            itemId: selectedItem.id,
          });

          inventoryData.push({
            userId: user.id,
            itemId: selectedItem.id,
          });
        }

        // 6. Compute Progression Updates
        let newXp = (user.xp ?? 0) + totalXpGained;
        let newLevel = user.level ?? 1;

        while (newXp >= getXpForLevel(newLevel)) {
          newXp -= getXpForLevel(newLevel);
          newLevel += 1;
        }

        // 7. Update User & Insert Inventory/Opening Relations
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            balance: user.balance - totalCost,
            xp: newXp,
            level: newLevel,
            hasExclusivePack: isExclusive ? false : (user.hasExclusivePack ?? false),
            activeLuck: isLuckActive ? (user.activeLuck ?? 1.0) : 1.0,
            activeDiscount: isDiscountActive ? (user.activeDiscount ?? 0) : 0,
            // Guaranteed strict non-null boolean payload
            activeXpBoost: Boolean(isXpBoostActive),
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
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error in /api/packs/open:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}