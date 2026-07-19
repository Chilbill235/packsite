import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";
import type { Item } from "@prisma/client";
import { auth } from "@/lib/auth";

// 1. GET: Fetches available packs (without items for performance)
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
      }
    });
    return NextResponse.json(packs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}

// 2. POST: Handles the pack opening logic securely
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: NEVER trust activeDiscount or activeLuck sent from the frontend request body!
    const { packId, quantity = 1, isFlashSale = false } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Enforce dynamic timestamp validations securely on the server
    const now = new Date();
    const isLuckExpired = user.luckExpiresAt ? new Date(user.luckExpiresAt).getTime() <= now.getTime() : true;
    const isDiscountExpired = user.discountExpiresAt ? new Date(user.discountExpiresAt).getTime() <= now.getTime() : true;
    const isXpExpired = user.xpBoostExpiresAt ? new Date(user.xpBoostExpiresAt).getTime() <= now.getTime() : true;

    // Read values directly from the verified database record
    const verifiedLuck = isLuckExpired ? 1.0 : user.activeLuck;
    const verifiedDiscount = isDiscountExpired ? 0.0 : user.activeDiscount;

    // Fetch the pack layout configuration
    let pack;
    let basePrice = 0;

    if (packId === "exclusive_vault_pack") {
      const items = await prisma.item.findMany({
        where: { rarity: { in: ['Legendary', 'Mythical', 'LEGENDARY', 'MYTHIC'] } }
      });
      pack = { id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", items };
      basePrice = 0;
    } else {
      pack = await prisma.pack.findUnique({
        where: { id: packId },
        include: { items: true },
      });
      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      basePrice = pack.price;
    }

    if (!pack || pack.items.length === 0) {
      return NextResponse.json({ error: "Pack has no configured items" }, { status: 404 });
    }

    // Calculate secure prices after database verified discount allocations
    let pricePerPack = basePrice;
    if (isFlashSale && packId !== "exclusive_vault_pack") {
      pricePerPack = Math.floor(basePrice * 0.5); 
    }
    if (verifiedDiscount > 0 && packId !== "exclusive_vault_pack") {
      pricePerPack = Math.floor(basePrice * (1 - verifiedDiscount));
    }

    const totalCost = pricePerPack * quantity;
    if (user.balance < totalCost) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    const wonItems: Item[] = [];

    // Process everything cleanly inside our single atomic database transaction block
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Calculate and roll items safely utilizing verified luck levels
      for (let i = 0; i < quantity; i++) {
        const wonItem = rollItem(pack.items, verifiedLuck);
        wonItems.push(wonItem);
      }

      // 2. Persist inventory increments atomically
      await tx.inventory.createMany({
        data: wonItems.map(item => ({
          userId: user.id,
          itemId: item.id
        }))
      });

      // 3. Conditionally clear expired metrics without deleting valid persistent buffs
      return await tx.user.update({
        where: { id: user.id },
        data: { 
          balance: { decrement: totalCost },
          
          activeLuck: isLuckExpired ? 1.0 : user.activeLuck,
          luckExpiresAt: isLuckExpired ? null : user.luckExpiresAt,

          activeDiscount: isDiscountExpired ? 0.0 : user.activeDiscount,
          discountExpiresAt: isDiscountExpired ? null : user.discountExpiresAt,

          activeXpBoost: isXpExpired ? false : user.activeXpBoost,
          xpBoostExpiresAt: isXpExpired ? null : user.xpBoostExpiresAt,
        },
        select: { 
          balance: true,
          activeLuck: true,
          activeDiscount: true,
          activeXpBoost: true,
          luckExpiresAt: true,
          discountExpiresAt: true,
          xpBoostExpiresAt: true,
        }
      });
    });

    return NextResponse.json({
      success: true,
      wonItems,
      newBalance: updatedUser.balance,
      user: updatedUser
    });

  } catch (error: unknown) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}