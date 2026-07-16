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
      
      // 2. Calculate price for the batch
      const unitPrice = isFlashSale ? Math.floor(pack.price * 0.5) : pack.price;
      const totalPrice = unitPrice * quantity;

      if (user.balance < totalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      // 3. Roll the items X times
      const wonItems = [];
      for (let i = 0; i < quantity; i++) {
        wonItems.push(rollItem(pack.items));
      }
      
      // 4. Perform Updates
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: totalPrice } },
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
        wonItems, // Returning the array
        newBalance: updatedUser.balance 
      });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}