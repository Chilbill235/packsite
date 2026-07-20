import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Production-tier rarity configuration and base item rolls
const RARITY_POOL = [
  { rarity: "COMMON", chance: 0.50, xp: 10, valueMultiplier: 1 },
  { rarity: "RARE", chance: 0.30, xp: 25, valueMultiplier: 2.5 },
  { rarity: "EPIC", chance: 0.12, xp: 60, valueMultiplier: 6 },
  { rarity: "LEGENDARY", chance: 0.06, xp: 150, valueMultiplier: 15 },
  { rarity: "MYTHIC", chance: 0.02, xp: 500, valueMultiplier: 50 },
];

// Helper function to calculate required XP for a given level
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

    const qty = Math.max(1, parseInt(quantity) || 1);

    // Run the operation inside an atomic transaction with an increased timeout (10 seconds)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch user profile and validate status
      const user = await tx.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const now = new Date();

      // Check boost expirations
      const isLuckActive = user.luckExpiresAt && new Date(user.luckExpiresAt) > now;
      const isDiscountActive = user.discountExpiresAt && new Date(user.discountExpiresAt) > now;
      const isXpBoostActive = user.xpBoostExpiresAt && new Date(user.xpBoostExpiresAt) > now;

      const currentLuck = isLuckActive ? (user.activeLuck ?? 1) : 1;
      const currentDiscount = isDiscountActive ? (user.activeDiscount ?? 0) : 0;
      const xpMultiplier = isXpBoostActive ? 2 : 1;

      // 2. Resolve Pack Info
      let basePrice = 0;
      let packName = "APOCALYPSE VAULT";
      let isExclusive = packId === "exclusive_vault_pack";

      if (!isExclusive) {
        const pack = await tx.pack.findUnique({ where: { id: packId } });
        if (!pack) {
          throw new Error("Pack configuration not found");
        }
        basePrice = Number(pack.price) || 0;
        packName = pack.name;
      } else {
        if (!user.hasExclusivePack) {
          throw new Error("No exclusive drop packs available to claim");
        }
      }

      // 3. Financial calculations
      let discountMultiplier = 1;
      if (!isExclusive) {
        if (isFlashSale) discountMultiplier = 0.5;
        else if (currentDiscount > 0) discountMultiplier = 1 - currentDiscount;
      }

      const finalUnitPrice = Math.floor(basePrice * discountMultiplier);
      const totalCost = finalUnitPrice * qty;

      if (user.balance < totalCost) {
        throw new Error("Insufficient coins! Wait for drops.");
      }

      // 4. Generate Loot Drops & Experience Logic
      let totalXpGained = 0;
      const wonItems = [];
      const openingsData = [];
      const inventoryData = [];

      for (let i = 0; i < qty; i++) {
        let rolledRarity = "COMMON";
        let rolledXp = 10;
        let rolledMultiplier = 1;
        let poolChance = 0.50;
        
        const randomRoll = Math.random();
        let cumulativeChance = 0;

        for (const pool of RARITY_POOL) {
          let adjustedChance = pool.chance;
          if (currentLuck > 1 && ["MYTHIC", "LEGENDARY", "EPIC"].includes(pool.rarity)) {
            adjustedChance *= currentLuck;
          }
          cumulativeChance += adjustedChance;
        }

        const rollSeed = randomRoll * cumulativeChance;
        let runningSum = 0;
        
        for (const pool of RARITY_POOL) {
          let adjustedChance = pool.chance;
          if (currentLuck > 1 && ["MYTHIC", "LEGENDARY", "EPIC"].includes(pool.rarity)) {
            adjustedChance *= currentLuck;
          }
          runningSum += adjustedChance;
          if (rollSeed <= runningSum) {
            rolledRarity = pool.rarity;
            rolledXp = pool.xp;
            rolledMultiplier = pool.valueMultiplier;
            poolChance = pool.chance;
            break;
          }
        }

        let possibleItems = await tx.item.findMany({
          where: { 
            rarity: rolledRarity,
            ...(isExclusive ? {} : { packId: packId })
          }
        });

        const calculatedValue = Math.floor((finalUnitPrice || 100) * rolledMultiplier * 0.2);

        if (possibleItems.length === 0) {
          let targetPackId = packId;
          if (isExclusive) {
            const anyPack = await tx.pack.findFirst();
            if (!anyPack) throw new Error("No packs exist in database to attach fallback item.");
            targetPackId = anyPack.id;
          }

          const fallbackItem = await tx.item.create({
            data: {
              name: `${rolledRarity} Emergency Drop #${Math.floor(Math.random() * 9000 + 1000)}`,
              rarity: rolledRarity,
              value: calculatedValue,
              image: rolledRarity,
              chance: poolChance,
              packId: targetPackId,
            }
          });
          possibleItems = [fallbackItem];
        }

        const selectedItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];

        totalXpGained += rolledXp * xpMultiplier;

        wonItems.push({
          name: selectedItem.name,
          rarity: rolledRarity,
          value: calculatedValue
        });

        openingsData.push({
          userId: user.id,
          packId: isExclusive ? (possibleItems[0]?.packId || "") : packId,
          itemId: selectedItem.id,
        });

        inventoryData.push({
          userId: user.id,
          itemId: selectedItem.id,
        });
      }

      // 5. Compute New Progression Levels
      let newXp = (user.xp ?? 0) + totalXpGained;
      let newLevel = user.level ?? 1;

      while (newXp >= getXpForLevel(newLevel)) {
        newXp -= getXpForLevel(newLevel);
        newLevel += 1;
      }

      // 6. Persist updates to database records
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: user.balance - totalCost,
          xp: newXp,
          level: newLevel,
          hasExclusivePack: isExclusive ? false : user.hasExclusivePack,
          activeLuck: isLuckActive ? user.activeLuck : 1,
          activeDiscount: isDiscountActive ? user.activeDiscount : 0,
        }
      });

      // Write historical unboxing items logs
      if (openingsData.length > 0) {
        await tx.opening.createMany({
          data: openingsData.map(op => ({
            userId: op.userId,
            packId: op.packId,
            itemId: op.itemId,
          }))
        });
      }

      // Populate user's vault inventory storage
      if (inventoryData.length > 0) {
        await tx.inventory.createMany({
          data: inventoryData.map(inv => ({
            userId: inv.userId,
            itemId: inv.itemId,
          }))
        });
      }

      return {
        newBalance: updatedUser.balance,
        wonItems,
        user: updatedUser
      };
    }, {
      maxWait: 10000,
      timeout: 10000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error in /api/packs/open:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}