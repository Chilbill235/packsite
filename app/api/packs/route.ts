import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packs = await prisma.pack.findMany({
      include: { items: true },
    });
    return NextResponse.json(packs);
  } catch (error) {
    console.error("PACKS_FETCH_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}