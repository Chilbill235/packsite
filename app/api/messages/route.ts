import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Correct way to get session in Auth.js / NextAuth v5
import { prisma as db } from "@/lib/prisma"; // Import prisma and alias it as db

export const dynamic = "force-dynamic";

// GET: Fetch messages and partner info by userId or username
export async function GET(req: Request) {
  try {
    const session = await auth(); // Use auth() instead of getServerSession
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const targetUsername = searchParams.get("username");

    let partnerId = targetUserId;

    // If username is provided instead of UUID, lookup the user first
    if (!partnerId && targetUsername) {
      const userRecord = await db.user.findUnique({
        where: { username: targetUsername },
        select: { id: true },
      });
      if (!userRecord) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      partnerId = userRecord.id;
    }

    if (!partnerId || partnerId === "undefined") {
      return NextResponse.json({ error: "Missing recipient identifier" }, { status: 400 });
    }

    // Fetch the partner details for chat header display
    const otherUser = await db.user.findUnique({
      where: { id: partnerId },
      select: { id: true, username: true, image: true },
    });

    // Fetch messages between current user and partner
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, recipientId: partnerId },
          { senderId: partnerId, recipientId: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages, otherUser });
  } catch (err) {
    console.error("MESSAGES_GET_ERROR", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Send a message supporting recipientId or recipientIdentifier
export async function POST(req: Request) {
  try {
    const session = await auth(); // Use auth() instead of getServerSession
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await req.json();
    const { recipientId, recipientIdentifier, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    let resolvedRecipientId = recipientId;

    // If a username handle was sent as recipientIdentifier, resolve it to an ID
    if (!resolvedRecipientId && recipientIdentifier) {
      const userRecord = await db.user.findUnique({
        where: { username: recipientIdentifier },
        select: { id: true },
      });
      if (!userRecord) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }
      resolvedRecipientId = userRecord.id;
    }

    if (!resolvedRecipientId || resolvedRecipientId === "undefined") {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    // Create the message using Prisma
    const newMessage = await db.message.create({
      data: {
        senderId: currentUserId,
        recipientId: resolvedRecipientId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (err) {
    console.error("MESSAGES_POST_ERROR", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}