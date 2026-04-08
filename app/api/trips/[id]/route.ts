import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// ─── GET /api/trips/[id] ──────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Fetch full details of participants using IDs stored in trip.participants[]
    const participants = await prisma.user.findMany({
      where: { id: { in: trip.participants } },
      select: {
        id:          true,
        name:        true,
        email:       true,
        age:         true,
        hikingLevel: true,
        createdAt:   true,
      },
    });

    return NextResponse.json({
      success: true,
      trip: {
        ...trip,
        participants,
        currentParticipants: participants.length,
      },
    });

  } catch (error) {
    console.error("[GET /api/trips/[id]]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}