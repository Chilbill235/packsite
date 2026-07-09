"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

export async function openPack(packId: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email } });
    const pack = await tx.pack.findUnique({ where: { id: packId }, include: { items: true } });

    if (!pack) throw new Error("Pack not found");
    if (!user || user.balance < pack.price) throw new Error("Insufficient balance");

    const wonItem = rollItem(pack.items);
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: pack.price } },
    });

    await tx.inventory.create({ data: { userId: user.id, itemId: wonItem.id } });
    await tx.opening.create({ data: { userId: user.id, packId: pack.id, itemId: wonItem.id } });

    return { wonItem, newBalance: updatedUser.balance };
  });
}

export async function sellItem(inventoryId: string) {
  if (!inventoryId) {
    throw new Error("Invalid inventory ID");
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const inventory = await prisma.inventory.findFirst({
    where: {
      id: inventoryId,
      user: { email },
    },
    include: { item: true },
  });

  if (!inventory) throw new Error("Item not found in your inventory");

  return await prisma.$transaction(async (tx) => {
    await tx.inventory.delete({ where: { id: inventoryId } });
    const updatedUser = await tx.user.update({
      where: { id: inventory.userId },
      data: { balance: { increment: inventory.item.value } },
    });

    return { newBalance: updatedUser.balance };
  });
}
