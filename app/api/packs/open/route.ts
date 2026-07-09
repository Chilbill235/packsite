import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

export async function POST(req: Request) {
  try {
    const { packId, isFastOpen } = await req.json(); // Accept isFastOpen
    const session = await auth();
    
    // Extract email to satisfy TypeScript type checking
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
      
      // Use the extracted 'email' variable
      const user = await tx.user.findUnique({ where: { email: email } });

      if (!pack || !user) throw new Error("Invalid request");

      // Apply the 1.2x multiplier if Fast Mode is active
      const finalPrice = isFastOpen ? Math.ceil(pack.price * 1.2) : pack.price;

      if (user.balance < finalPrice) throw new Error("Insufficient balance");

      const wonItem = rollItem(pack.items);

      await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: finalPrice } } });
      await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
      await tx.opening.create({ data: { userId: user.id, packId, itemId: wonItem.id } });

      return { wonItem, newBalance: user.balance - finalPrice };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to open pack" }, { status: 400 });
  }
}