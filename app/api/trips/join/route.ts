import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * POST /api/trips/join
 * Creates a join request for a trip (status: PENDING)
 */
export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Trip ID is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true, currentParticipants: true, maxParticipants: true },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Trip not found" },
        { status: 404 }
      );
    }

    // Check if trip is full
    if (trip.currentParticipants >= trip.maxParticipants) {
      return NextResponse.json(
        { success: false, message: "Trip is full" },
        { status: 409 }
      );
    }

    // Check if user already has a join request (pending, approved, or rejected)
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_tripId: {
          userId: user.id,
          tripId: id,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: `Already have a ${existingRequest.status.toLowerCase()} request for this trip` },
        { status: 409 }
      );
    }

    // Create a new join request with PENDING status
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: user.id,
        tripId: id,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        trip: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      { success: true, joinRequest, status: "PENDING" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[join POST]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}