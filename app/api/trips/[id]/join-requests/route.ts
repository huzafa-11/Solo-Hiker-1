// FILE PATH: app/api/trips/[id]/join-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * GET /api/trips/[id]/join-requests
 * Fetch all PENDING join requests for a trip (organizer only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user from email (your session stores email, not id)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Only organizer can view join requests
    if (trip.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the organizer can view join requests" },
        { status: 403 }
      );
    }

    const requests = await prisma.joinRequest.findMany({
      where: { tripId: id, status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hikingLevel: true,  // ✓ exists on your User model
            age: true,          // ✓ exists on your User model
            // image: true      // ✗ REMOVED — does not exist on your User model
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(requests);

  } catch (error: any) {
    console.error("[join-requests GET]", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}