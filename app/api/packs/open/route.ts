import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

// Utility type to extract the transaction client type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Receive the flag from the frontend
    const { packId, isFlashSale } = await req.json();

    return await prisma.$transaction(async (tx: TransactionClient) => {
      const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
      const user = await tx.user.findUnique({ where: { email: session.user.email as string } });

      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      
      // Calculate the price ON THE SERVER
      const finalPrice = isFlashSale ? Math.floor(pack.price * 0.5) : pack.price;

      // Compare balance against the SERVER-CALCULATED price
      if (!user || user.balance < finalPrice) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      const wonItem = rollItem(pack.items);
      
      // Update using the finalPrice
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: finalPrice } },
      });

      await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
      await tx.opening.create({ data: { userId: user.id, packId, itemId: wonItem.id } });

      return NextResponse.json({ 
        success: true, 
        wonItem, 
        newBalance: updatedUser.balance 
      });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}