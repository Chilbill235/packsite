import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rollItem } from "@/lib/openingEngine";

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

    // email is guaranteed to exist after the earlier check
    // @ts-ignore
    const email = session.user!.email;

    return await prisma.$transaction(async (tx) => {
      const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });
      const user = await tx.user.findUnique({ where: { email } });

      if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      if (!user || user.balance < pack.price) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      const wonItem = rollItem(pack.items);
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: pack.price } },
      });

      await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
      await tx.opening.create({ data: { userId: user.id, packId, itemId: wonItem.id } });

      return NextResponse.json({ success: true, wonItem, item: wonItem, newBalance: updatedUser.balance });
    });
  } catch (error) {
    console.error("BUY_PACK_ERROR", error);
    return NextResponse.json({ error: "Failed to buy pack" }, { status: 500 });
  }
}
