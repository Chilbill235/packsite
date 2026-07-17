import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Ensure this points to your Auth.js v5 config

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user using Auth.js v5 'auth()'
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await req.json();
    
    // Fetch the user from the database
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Define the Pack Logic (Virtual or Database)
    let pack;
    let cost = 0;

    if (packId === "exclusive_vault_pack") {
      // Fetch high-value items from your DB for the vault pack
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
      // Fetch standard pack
      pack = await prisma.pack.findUnique({
        where: { id: packId },
        include: { items: true },
      });
      cost = pack?.price || 0;
    }

    if (!pack || pack.items.length === 0) {
      return NextResponse.json({ error: "Pack not found or empty" }, { status: 404 });
    }

    // 3. Check Balance
    if (user.balance < cost) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 4. Weighted Random Selection Algorithm
    // Uses the 'chance' property from your database items
    const totalChance = pack.items.reduce((sum, item) => sum + (Number(item.chance) || 1), 0);
    let random = Math.random() * totalChance;
    let wonItem = pack.items[0];

    for (const item of pack.items) {
      random -= (Number(item.chance) || 1);
      if (random <= 0) {
        wonItem = item;
        break;
      }
    }

    // 5. Execute Transaction: Deduct cost and add to inventory
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