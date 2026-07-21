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

    const { inventoryItemId } = await req.json();
    if (!inventoryItemId) {
      return NextResponse.json({ error: "Missing inventoryItemId" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invItem = await tx.inventory.findUnique({
        where: { id: inventoryItemId },
        include: { item: true },
      });

      if (!invItem) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const itemValue = invItem.item.value;

      await tx.inventory.delete({
        where: { id: inventoryItemId },
      });

      const updatedUser = await tx.user.update({
        where: { id: invItem.userId },
        data: { balance: { increment: itemValue } },
      });

      return {
        newBalance: updatedUser.balance,
        soldValue: itemValue,
      };
    });

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      soldValue: result.soldValue,
    });
  } catch (error: any) {
    if (error.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    console.error("SELL_ITEM_ERROR", error);
    return NextResponse.json(
      { error: "Failed to sell item" },
      { status: 500 }
    );
  }
}