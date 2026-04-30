{/*import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Us user ki saari conversations fetch karo
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { has: userId },
      },
      orderBy: { lastMessageTime: "desc" },
    });

    // Har conversation mein other user ka naam add karo
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participants.find((p) => p !== userId) ?? "";
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, name: true },
        });

        // Unread count
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: { not: userId },
          },
        });

        return {
          id: conv.id,
          participants: conv.participants,
          lastMessage: conv.lastMessage ?? "",
          lastMessageTime: conv.lastMessageTime.toISOString(),
          otherUserId: otherUser?.id ?? "",
          otherUserName: otherUser?.name ?? "Unknown",
          unreadCount,
          isOnline: false, // WebSocket se update hoga
        };
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Conversations fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  */}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      orderBy: {
        lastMessageTime: "desc",
      },
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.participants.find((p) => p !== userId) ?? "";

        const otherUser = otherUserId
          ? await prisma.user.findUnique({
              where: { id: otherUserId },
              select: {
                id: true,
                name: true,
              },
            })
          : null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: {
              not: userId,
            },
          },
        });

        return {
          id: conv.id,
          participants: conv.participants,
          lastMessage: conv.lastMessage ?? "",
          lastMessageTime: conv.lastMessageTime
            ? conv.lastMessageTime.toISOString()
            : null,
          otherUserId: otherUser?.id ?? "",
          otherUserName: otherUser?.name ?? "Unknown",
          unreadCount,
          isOnline: false,
        };
      })
    );

    return NextResponse.json(result);

  } catch (err) {
    console.error("Conversations fetch error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}