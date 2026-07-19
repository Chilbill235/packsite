import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rollItem } from "@/lib/openingEngine";

// Utility type to extract the transaction client type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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

    // Pass the typed TransactionClient to the callback
    return await prisma.$transaction(async (tx: TransactionClient) => {
      const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
      const user = await tx.user.findUnique({ where: { email } });

      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // 1. Check timestamp expirations
      const now = new Date();
      const isLuckExpired = user.luckExpiresAt ? new Date(user.luckExpiresAt).getTime() <= now.getTime() : true;
      const isDiscountExpired = user.discountExpiresAt ? new Date(user.discountExpiresAt).getTime() <= now.getTime() : true;
      const isXpExpired = user.xpBoostExpiresAt ? new Date(user.xpBoostExpiresAt).getTime() <= now.getTime() : true;

      // 2. Determine values to apply based on expiration state
      const currentLuck = isLuckExpired ? 1.0 : user.activeLuck;
      const currentDiscount = isDiscountExpired ? 0.0 : user.activeDiscount;

      // 3. Calculate discounted price if applicable
      let finalPrice = pack.price;
      if (currentDiscount > 0) {
        finalPrice = Math.floor(finalPrice * (1 - currentDiscount));
      }

      if (user.balance < finalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      // 4. Roll utilizing active duration luck values
      const wonItem = rollItem(pack.items, currentLuck);

      // 5. Update user balance and conditionally reset expired buffs
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          balance: { decrement: finalPrice },
          
          // Only drop down to default values if the duration has expired
          activeLuck: isLuckExpired ? 1.0 : user.activeLuck,
          luckExpiresAt: isLuckExpired ? null : user.luckExpiresAt,

          activeDiscount: isDiscountExpired ? 0.0 : user.activeDiscount,
          discountExpiresAt: isDiscountExpired ? null : user.discountExpiresAt,

          activeXpBoost: isXpExpired ? false : user.activeXpBoost,
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