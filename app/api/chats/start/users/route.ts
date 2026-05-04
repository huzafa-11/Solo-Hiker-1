import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const { otherUserId } = await req.json();

    // Pehle check karo — yeh conversation pehle se exist karti hai?
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: currentUserId } },
          { participants: { has: otherUserId } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Nahi hai toh naya banao
    const conversation = await prisma.conversation.create({
      data: {
        participants: [currentUserId, otherUserId],
        lastMessage: "",
        lastMessageTime: new Date(),
      },
    });

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Start conversation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}