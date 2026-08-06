import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId, content } = await request.json();

    if (!recipientId || !content?.trim()) {
      return NextResponse.json(
        { error: "Recipient ID and content are required" },
        { status: 400 }
      );
    }

    const recipient = await prisma.user.findFirst({
      where: { OR: [{ id: recipientId }, { username: recipientId }] },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient user not found" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: recipient.id,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("SEND_MESSAGE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to dispatch message" },
      { status: 500 }
    );
  }
}