import { NextResponse, NextRequest } from "next/server";
import { sellItem } from "@/app/actions";

export async function POST(request: NextRequest, context: { params: Promise<{ inventoryId: string }> }) {
  const { inventoryId } = await context.params;
  if (!inventoryId) {
    return NextResponse.json({ error: "Missing inventoryId" }, { status: 400 });
  }
  try {
    const result = await sellItem(inventoryId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

