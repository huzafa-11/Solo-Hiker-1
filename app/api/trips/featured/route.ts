import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const trip = await prisma.trip.findFirst({
      where: { isPublic: true },
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
        user: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}