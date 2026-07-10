import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packs = await prisma.pack.findMany({
      include: { items: true },
    });
    return NextResponse.json(packs);
  } catch (error: any) {
    console.error("PACKS_FETCH_ERROR", error);
    // Return the actual error message to the browser console for easier debugging
    return NextResponse.json({ 
      error: "Failed to fetch packs", 
      details: error.message 
    }, { status: 500 });
  }
}