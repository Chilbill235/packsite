import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

// Re-add auth import to ensure it's properly recognized
import { auth } from "@/lib/auth";

// 1. GET: Fetches available packs (without items for performance)
// Items are fetched separately when opening a pack via POST /api/packs/open
export async function GET() {
  try {
    const packs = await prisma.pack.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
      }
    });
    return NextResponse.json(packs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}

// 2. POST: Handles the pack opening logic
// Added comment to trigger TypeScript recheck
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await req.json();
    
    // Fetch user including the luck stat
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Pack logic
    let pack;
    let cost = 0;

    if (packId === "exclusive_vault_pack") {
      const items = await prisma.item.findMany({ 
        where: { rarity: { in: ['Legendary', 'Mythical'] } } 
      });
      pack = { id: "exclusive_vault_pack", name: "🔥 Secret Vault Pack", items };
      cost = 0;
    } else {
      pack = await prisma.pack.findUnique({
        where: { id: packId },
        include: { items: true },
      });
      cost = pack?.price || 0;
    }

    if (!pack || pack.items.length === 0) return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    if (user.balance < cost) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    // Roll using our engine (Luck defaults to 1 if not defined on user)
    const wonItem = rollItem(pack.items, (user as any).luck || 1.0);

    // Atomic Transaction
    const [updatedUser] = await prisma.$transaction([
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
      newBalance: updatedUser.balance 
    });

  } catch (error: any) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}