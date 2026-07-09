import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inventoryId } = await req.json();
    if (!inventoryId) {
      return NextResponse.json({ error: "Inventory Item ID is required" }, { status: 400 });
    }

    // Fetch the target inventory item verifying it belongs to the active user
    const inventoryItem = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        user: { email: session.user.email },
      },
      include: { item: true },
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: "Item not found in your inventory" }, { status: 404 });
    }

    // Execute atomic deletion and credit refund
    const result = await prisma.$transaction(async (tx) => {
      await tx.inventory.delete({
        where: { id: inventoryId },
      });

      const updatedUser = await tx.user.update({
        where: { id: inventoryItem.userId },
        data: {
          balance: { increment: inventoryItem.item.value },
        },
      });

      return { newBalance: updatedUser.balance };
    });

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: `Successfully sold ${inventoryItem.item.name} for ${inventoryItem.item.value} coins.`,
    });
  } catch (error) {
    console.error("SELL_ITEM_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}