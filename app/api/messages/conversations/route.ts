import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all unique users sent to or received from
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, username: true, image: true } },
        recipient: { select: { id: true, username: true, image: true } },
      },
    });

    // Filter to unique user conversations
    const map = new Map();
    for (const msg of recentMessages) {
      const partner = msg.senderId === userId ? msg.recipient : msg.sender;
      if (!map.has(partner.id)) {
        map.set(partner.id, {
          user: partner,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          read: msg.recipientId === userId ? msg.read : true,
        });
      }
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (error) {
    console.error("GET_CONVERSATIONS_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}