import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Promise type
) {
  try {
    const { id } = await params;  // ← await params

    const trip = await prisma.trip.findUnique({
      where: { id },              // ← now id is defined
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        difficulty: true,
        maxParticipants: true,
        currentParticipants: true,
        images: true,
        isPublic: true,
        participants: true,
        createdAt: true,
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}