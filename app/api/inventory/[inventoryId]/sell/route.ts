import { NextResponse, NextRequest } from "next/server";
import { sellItem } from "@/app/actions";

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ inventoryId: string }> }
) {
  try {
    // Await the params as required by Next.js
    const { inventoryId } = await context.params;
    
    if (!inventoryId) {
      return NextResponse.json({ error: "Missing inventoryId" }, { status: 400 });
    }

    // Call the server action
    // Note: Since sellItem handles its own transaction, 
    // you don't need to define 'tx' here.
    const result = await sellItem(inventoryId);
    
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}