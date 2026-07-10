import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      const user = await tx.user.findUnique({ 
        where: { email: email } 
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const inventory = await tx.inventory.findMany({ 
        where: { userId: user.id }, 
        include: { item: true } 
      });

      if (inventory.length === 0) {
        return NextResponse.json({ error: "No items to sell" }, { status: 400 });
      }

      // Explicitly typing both the accumulator 'sum' and the current item 'inv'
      const totalValue = inventory.reduce((sum: number, inv: { item: { value: number } }) => {
        return sum + inv.item.value;
      }, 0);

      await tx.inventory.deleteMany({ 
        where: { userId: user.id } 
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: totalValue } }
      });

      return NextResponse.json({ 
        success: true, 
        newBalance: updatedUser.balance,
        soldCount: inventory.length 
      });
    });
  } catch (error) {
    console.error("SELL_ALL_ERROR", error);
    return NextResponse.json({ error: "Failed to sell all items" }, { status: 500 });
  }
}