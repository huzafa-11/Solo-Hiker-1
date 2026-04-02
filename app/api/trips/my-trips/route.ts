import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: { user: { email: session.user.email } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        startDate: true,
        endDate: true,
        difficulty: true,
        images: true,
        currentParticipants: true,
        maxParticipants: true,
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true, trips });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}