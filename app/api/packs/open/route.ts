import { NextResponse } from "next/server";
import type { Item } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rollItem } from "@/lib/openingEngine";

const MAX_PACKS_PER_REQUEST = 10;
const EXCLUSIVE_PACK_ID = "exclusive_vault_pack";

const FALLBACK_PACK_ID_TO_NAME: Record<string, string> = {
  "76796f88-c7d0-442a-bfeb-380c3863c8b7": "Cosmic Vault",
  "1a91f6e0-03ce-4a1a-aae0-51ca4057ba8f": "Starter Cache",
  "5d2b1d7e-0f4d-4425-ba60-a0ddfeed968f": "Event Crate",
  "02ada6c5-4bb7-4d2c-953d-3228f28855eb": "Void Box",
  "5fd47c89-8fd5-4946-9f09-00d90055c6e5": "Promo Bundle",
};

type OpenPackBody = {
  packId?: unknown;
  quantity?: unknown;
  isFlashSale?: unknown;
};

const parseQuantity = (value: unknown) => {
  const quantity = Number(value ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PACKS_PER_REQUEST) {
    return null;
  }
  return quantity;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as OpenPackBody;
    const packId = typeof body.packId === "string" ? body.packId : "";
    const quantity = parseQuantity(body.quantity);
    const isFlashSale = body.isFlashSale === true;

    if (!packId) {
      return NextResponse.json({ error: "Missing pack id" }, { status: 400 });
    }

    if (quantity === null) {
      return NextResponse.json(
        { error: `Invalid quantity. Open between 1 and ${MAX_PACKS_PER_REQUEST} packs at a time.` },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: session.user.email as string },
      });

      if (!user) {
        return { response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
      }

      let items: Item[] = [];
      let packPrice = 0;
      let resolvedPackId = packId;

      if (packId === EXCLUSIVE_PACK_ID) {
        if (!user.hasExclusivePack) {
          return {
            response: NextResponse.json(
              { error: "This exclusive pack is locked. Claim an exclusive pack reward first." },
              { status: 403 },
            ),
          };
        }

        items = await tx.item.findMany({
          where: {
            rarity: {
              in: ["LEGENDARY", "MYTHIC", "COSMIC", "VOID", "CELESTIAL", "OMEGA", "Legendary", "Mythical"],
            },
          },
        });

        if (items.length === 0) {
          items = await tx.item.findMany();
        }
      } else {
        const fallbackName = FALLBACK_PACK_ID_TO_NAME[packId];
        const pack = await tx.pack.findFirst({
          where: fallbackName ? { OR: [{ id: packId }, { name: fallbackName }] } : { id: packId },
          include: { items: true },
        });

        if (!pack) {
          return { response: NextResponse.json({ error: "Pack not found" }, { status: 404 }) };
        }

        if (pack.category.toLowerCase() === "exclusive" && !user.hasExclusivePack) {
          return {
            response: NextResponse.json(
              { error: "This exclusive pack is locked. Claim an exclusive pack reward first." },
              { status: 403 },
            ),
          };
        }

        items = pack.items;
        packPrice = pack.price;
        resolvedPackId = pack.id;
      }

      if (items.length === 0) {
        return { response: NextResponse.json({ error: "This pack has no items configured" }, { status: 404 }) };
      }

      let unitPrice = packPrice;
      if (isFlashSale && packId !== EXCLUSIVE_PACK_ID) {
        unitPrice = Math.floor(unitPrice * 0.5);
      }
      if (user.activeDiscount > 0 && packId !== EXCLUSIVE_PACK_ID) {
        unitPrice = Math.floor(unitPrice * (1 - user.activeDiscount));
      }

      const totalPrice = unitPrice * quantity;
      if (user.balance < totalPrice) {
        return { response: NextResponse.json({ error: "Insufficient balance" }, { status: 400 }) };
      }

      const wonItems = Array.from({ length: quantity }, () => rollItem(items, user.activeLuck));

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: totalPrice },
          activeLuck: 1.0,
          activeDiscount: 0.0,
          hasExclusivePack: packId === EXCLUSIVE_PACK_ID ? false : user.hasExclusivePack,
          activeXpBoost: false,
        },
        select: {
          balance: true,
          activeLuck: true,
          activeDiscount: true,
          hasExclusivePack: true,
          activeXpBoost: true,
        },
      });

      await tx.inventory.createMany({
        data: wonItems.map((item) => ({ userId: user.id, itemId: item.id })),
      });

      await tx.opening.createMany({
        data: wonItems.map((item) => ({
          userId: user.id,
          packId: packId === EXCLUSIVE_PACK_ID ? item.packId : resolvedPackId,
          itemId: item.id,
        })),
      });

      return {
        response: NextResponse.json({
          success: true,
          wonItem: wonItems[0],
          wonItems,
          newBalance: updatedUser.balance,
          user: updatedUser,
        }),
      };
    });

    return result.response;
  } catch (error) {
    console.error("PACK_OPEN_ERROR", error);
    return NextResponse.json({ error: "Failed to open pack" }, { status: 500 });
  }
}
