import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const inventory = await tx.inventory.findMany({
        where: { userId: user.id },
        include: { item: true },
      });

      if (inventory.length === 0) {
        throw new Error("NO_ITEMS");
      }

      const totalValue = inventory.reduce((sum, inv) => {
        return sum + (inv.item?.value || 0);
      }, 0);

      await tx.inventory.deleteMany({
        where: { userId: user.id },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: totalValue } },
      });

      return {
        newBalance: updatedUser.balance,
        soldCount: inventory.length,
        totalValue,
      };
    });

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      soldCount: result.soldCount,
      totalValue: result.totalValue,
    });
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (error.message === "NO_ITEMS") {
      return NextResponse.json({ error: "No items to sell" }, { status: 400 });
    }

    console.error("SELL_ALL_ERROR", error);
    return NextResponse.json(
      { error: "Failed to sell all items" },
      { status: 500 }
    );
  }
}