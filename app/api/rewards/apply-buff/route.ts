import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Buff durations in milliseconds
const BUFF_DURATIONS: Record<string, number> = {
  luck_boost_1_5x: 30 * 60 * 1000,   // 30 minutes
  luck_boost_2x: 15 * 60 * 1000,     // 15 minutes  
  luck_boost_3x: 10 * 60 * 1000,     // 10 minutes
  discount_10: 60 * 60 * 1000,       // 1 hour
  discount_15: 45 * 60 * 1000,       // 45 minutes
  discount_20: 30 * 60 * 1000,       // 30 minutes
  exclusive_pack: 24 * 60 * 60 * 1000, // 24 hours (tracked via frontend/session lifecycle)
  xp_boost_2x: 2 * 60 * 60 * 1000,   // 2 hours
  coin_grant_100: 0,                 // instant claim, no duration
  coin_grant_150: 0,
  coin_grant_200: 0,
  coin_grant_250: 0,
  coin_grant_300: 0,
  coin_grant_500: 0
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { buffType } = body;

    if (!buffType) {
      return NextResponse.json({ error: "Missing buff type" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    const now = new Date();
    
    // Normalize lookups cleanly
    const normalizedType = buffType.replace(/\./g, "_");
    
    if (BUFF_DURATIONS[normalizedType] === undefined) {
      return NextResponse.json({ error: `Invalid buff type requested: ${buffType}` }, { status: 400 });
    }

    const durationMs = BUFF_DURATIONS[normalizedType];
    const expirationDate = durationMs > 0 ? new Date(now.getTime() + durationMs) : null;

    // Handle Luck Boosts
    if (buffType.startsWith("luck_boost_")) {
      const luckStr = buffType.replace("luck_boost_", "").replace("x", "");
      const luckVal = parseFloat(luckStr);
      if (!isNaN(luckVal)) {
        updateData.activeLuck = luckVal;
        updateData.luckExpiresAt = expirationDate;
      }
    }
    // Handle Active Shop Discounts
    else if (buffType.startsWith("discount_")) {
      const discountStr = buffType.replace("discount_", "");
      const discountVal = parseInt(discountStr, 10);
      if (!isNaN(discountVal)) {
        updateData.activeDiscount = discountVal / 100;
        updateData.discountExpiresAt = expirationDate;
      }
    }
    // Handle Exclusive Pack Unlocks (Removed the non-existent exclusivePackExpiresAt db column)
    else if (buffType === "exclusive_pack") {
      updateData.hasExclusivePack = true;
    }
    // Handle XP Progression Multipliers
    else if (buffType === "xp_boost_2x") {
      updateData.activeXpBoost = true;
      updateData.xpBoostExpiresAt = expirationDate;
    }
    // Standard Coin Grants
    else if (buffType.startsWith("coin_grant_")) {
      const coinStr = buffType.replace("coin_grant_", "");
      const coinVal = parseInt(coinStr, 10);
      if (!isNaN(coinVal)) {
        updateData.balance = { increment: coinVal };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      id: updatedUser.id,
      email: updatedUser.email,
      balance: updatedUser.balance,
      activeLuck: updatedUser.activeLuck,
      activeDiscount: updatedUser.activeDiscount,
      hasExclusivePack: updatedUser.hasExclusivePack,
      activeXpBoost: updatedUser.activeXpBoost,
      luckExpiresAt: updatedUser.luckExpiresAt,
      discountExpiresAt: updatedUser.discountExpiresAt,
      xpBoostExpiresAt: updatedUser.xpBoostExpiresAt,
      message: "Successfully processed buff: " + buffType,
    });

  } catch (error) {
    console.error("Error applying buff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}