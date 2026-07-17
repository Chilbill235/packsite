import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";
import type { Item } from "@prisma/client";

// Re-add auth import to ensure it's properly recognized
import { auth } from "@/lib/auth";

// 1. GET: Fetches available packs (without items for performance)
// Items are fetched separately when opening a pack via POST /api/packs/open
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

// 2. POST: Handles the pack opening logic
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId, quantity = 1, isFlashSale = false, activeDiscount = 0, activeLuck = 1 } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch the pack
    let pack;
    let basePrice = 0;

    if (packId === "exclusive_vault_pack") {
      // For exclusive vault pack, we don't use the pack table, we define it on the fly
      const items = await prisma.item.findMany({
        where: { rarity: { in: ['Legendary', 'Mythical'] } }
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

    if (!pack || pack.items.length === 0) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

    // Calculate price per pack after discounts
    let pricePerPack = basePrice;
    if (isFlashSale && packId !== "exclusive_vault_pack") {
      pricePerPack = Math.floor(basePrice * 0.5); // 50% off
    }
    if (activeDiscount > 0 && packId !== "exclusive_vault_pack") {
      pricePerPack = Math.floor(basePrice * (1 - activeDiscount));
    }

    const totalCost = pricePerPack * quantity;
    if (user.balance < totalCost) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    // We'll roll for each pack
    const wonItems: Item[] = [];
    // We'll update the user's balance and create inventory entries in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // First, deduct the total cost and get the updated user
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: totalCost } },
        select: { balance: true }
      });

      // Then, for each pack, roll an item and create an inventory entry
      for (let i = 0; i < quantity; i++) {
        // Use the activeLuck from the request (client-sent)
        const wonItem = rollItem(pack.items, activeLuck);
        wonItems.push(wonItem);
        await tx.inventory.create({
          data: {
            userId: user.id,
            itemId: wonItem.id
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      wonItems,
      newBalance: updatedUser.balance
    });

  } catch (error: any) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}