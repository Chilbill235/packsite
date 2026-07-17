import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Correct v5 import

export async function POST(request: Request) {
  try {
    // Authenticate the active user session
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

    // Initialize clean payload object for database updates
    const updateData: any = {};

    // 1. Handle Luck Boosts (Improves pulling chances)
    if (buffType.startsWith("luck_boost_")) {
      const luckStr = buffType.replace("luck_boost_", "").replace("x", "");
      const luckVal = parseFloat(luckStr);
      if (!isNaN(luckVal)) {
        updateData.activeLuck = luckVal;
      }
    }

    // 2. Handle Active Shop Discounts
    else if (buffType.startsWith("discount_")) {
      const discountStr = buffType.replace("discount_", "");
      const discountVal = parseInt(discountStr, 10);
      if (!isNaN(discountVal)) {
        updateData.activeDiscount = discountVal / 100; // e.g., 0.20 for 20% off
      }
    }

    // 3. Handle Exclusive Pack Unlocks
    else if (buffType === "exclusive_pack") {
      updateData.hasExclusivePack = true;
    }

    // 4. Handle XP Progression Multipliers
    else if (buffType === "xp_boost_2x") {
      updateData.activeXpBoost = true;
    }

    // 5. Fallback: Standard Coin Grants
    else if (buffType.startsWith("coin_grant_")) {
      const coinStr = buffType.replace("coin_grant_", "");
      const coinVal = parseInt(coinStr, 10);
      if (!isNaN(coinVal)) {
        updateData.balance = { increment: coinVal };
      }
    }

    // Persist changes to database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      activeLuck: updatedUser.activeLuck,
      activeDiscount: updatedUser.activeDiscount,
      hasExclusivePack: updatedUser.hasExclusivePack,
      activeXpBoost: updatedUser.activeXpBoost,
      balance: updatedUser.balance,
      message: `Successfully processed buff details for: ${buffType}`,
    });

  } catch (error) {
    console.error("Error applying database chance buff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}