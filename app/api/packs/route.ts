import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Ensure this path is correct

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await req.json();
    
    // Fetch user from database
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Define the Pack Logic (Virtual or Database)
    let pack;
    let cost = 0;

    if (packId === "exclusive_vault_pack") {
      // Fetch high-value items from your DB
      const vaultItems = await prisma.item.findMany({ 
        where: { rarity: { in: ['Legendary', 'Mythical'] } } 
      });
      
      pack = {
        id: "exclusive_vault_pack",
        name: "🔥 Secret Vault Pack",
        items: vaultItems
      };
      cost = 0; // Vault pack is free
    } else {
      pack = await prisma.pack.findUnique({
        where: { id: packId },
        include: { items: true },
      });
      cost = pack?.price || 0;
    }

    if (!pack || pack.items.length === 0) {
      return NextResponse.json({ error: "Pack not found or empty" }, { status: 404 });
    }

    // 2. Check Balance
    if (user.balance < cost) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 3. Weighted Random Selection Algorithm
    const totalChance = pack.items.reduce((sum, item) => sum + (item.chance || 1), 0);
    let random = Math.random() * totalChance;
    let wonItem = pack.items[0];

    for (const item of pack.items) {
      random -= (item.chance || 1);
      if (random <= 0) {
        wonItem = item;
        break;
      }
    }

    // 4. Execute Transaction
    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: cost } }
      }),
      prisma.inventory.create({
        data: {
          userId: user.id,
          itemId: wonItem.id
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      reward: wonItem,
      newBalance: user.balance - cost
    });

  } catch (error: any) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}