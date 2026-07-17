import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get quantity from body (default to 1)
    const { packId, isFlashSale, quantity = 1 } = await req.json();

    return await prisma.$transaction(async (tx) => {
      const pack = await tx.pack.findUnique({ 
        where: { id: packId }, 
        include: { items: true } 
      });
      const user = await tx.user.findUnique({ 
        where: { email: session.user.email as string } 
      });

      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      // 2. CHECK EXCLUSIVE PACK RESTRICTION
      // Gatekeeps the pack if it's marked as "exclusive" and user doesn't have the key unlocked
      if (pack.category.toLowerCase() === "exclusive" && !user.hasExclusivePack) {
        return NextResponse.json({ 
          error: "This exclusive pack is locked! Open a secret vault drop notification to access it." 
        }, { status: 403 });
      }

      // 3. CALCULATE PRICE WITH DISCOUNTS
      // Combines flash sale discounts (50%) with the user's active custom shop discount
      let unitPrice = isFlashSale ? Math.floor(pack.price * 0.5) : pack.price;
      
      if (user.activeDiscount > 0) {
        unitPrice = Math.floor(unitPrice * (1 - user.activeDiscount));
      }
      
      const totalPrice = unitPrice * quantity;

      if (user.balance < totalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      // 4. APPLY LUCK BUFF TO DROP ODDS
      // Temporarily scales up the rolling chances of non-common items based on activeLuck multiplier
      let itemsToRoll = pack.items;
      if (user.activeLuck > 1.0) {
        itemsToRoll = pack.items.map(item => {
          const isRare = item.rarity.toLowerCase() !== "common";
          return {
            ...item,
            chance: isRare ? item.chance * user.activeLuck : item.chance
          };
        });
      }

      // 5. ROLL THE ITEMS X TIMES
      const wonItems = [];
      for (let i = 0; i < quantity; i++) {
        wonItems.push(rollItem(itemsToRoll));
      }
      
      // 6. PERFORM UPDATES & CONSUME SINGLE-USE BUFFS
      // Resets active luck, active discounts, exclusive keys, and active XP boosts back to default state
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          balance: { decrement: totalPrice },
          activeLuck: 1.0,         // Reset back to normal 1x luck
          activeDiscount: 0.0,     // Reset discount back to normal 0%
          hasExclusivePack: false, // Consume the key so they have to earn another
          activeXpBoost: false,    // Consume active double XP buff
        },
      });

      // Bulk create inventory items
      await tx.inventory.createMany({
        data: wonItems.map(item => ({ userId: user.id, itemId: item.id }))
      });

      // Bulk create history logs
      await tx.opening.createMany({
        data: wonItems.map(item => ({ userId: user.id, packId, itemId: item.id }))
      });

      return NextResponse.json({ 
        success: true, 
        wonItems, // Returning the array of won items
        newBalance: updatedUser.balance,
        xpBoostActive: user.activeXpBoost // Return XP state to frontend to calculate double-progression displays
      });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}