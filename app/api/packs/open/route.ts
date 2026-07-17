import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

// Configure maximum packs a user can open in a single click
const MAX_PACKS_PER_REQUEST = 10;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get request body
    const body = await req.json();
    const packId = body.packId;
    const isFlashSale = body.isFlashSale === true;
    
    // Parse quantity securely to ensure it's a valid integer
    const quantity = parseInt(body.quantity || "1", 10);

    // SECURITY CHECK: Prevent infinite free pack rolling
    if (isNaN(quantity) || quantity < 1 || quantity > MAX_PACKS_PER_REQUEST) {
      return NextResponse.json({ 
        error: `Invalid quantity. You can only open between 1 and ${MAX_PACKS_PER_REQUEST} packs at a time.` 
      }, { status: 400 });
    }

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
      if (pack.category.toLowerCase() === "exclusive" && !user.hasExclusivePack) {
        return NextResponse.json({ 
          error: "This exclusive pack is locked! Open a secret vault drop notification to access it." 
        }, { status: 403 });
      }

      // 3. CALCULATE PRICE WITH DISCOUNTS
      let unitPrice = isFlashSale ? Math.floor(pack.price * 0.5) : pack.price;
      
      if (user.activeDiscount > 0) {
        unitPrice = Math.floor(unitPrice * (1 - user.activeDiscount));
      }
      
      const totalPrice = unitPrice * quantity;

      if (user.balance < totalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      // 4. APPLY LUCK BUFF TO DROP ODDS
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
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          balance: { decrement: totalPrice },
          activeLuck: 1.0,         // Reset back to normal 1x luck
          activeDiscount: 0.0,     // Reset discount back to normal 0%
          hasExclusivePack: false, // Consume the key
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
        wonItems, 
        newBalance: updatedUser.balance,
        xpBoostActive: user.activeXpBoost 
      });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}