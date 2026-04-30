// FILE PATH: app/api/trips/[id]/join-requests/route.ts
// Handles:
// POST = user requests to join a trip
// GET  = organizer fetches all pending applicants

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// ─────────────────────────────────────────────────────────────
// POST /api/trips/:id/join-requests
// Create a join request for a trip
// ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = id;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found." },
      { status: 404 }
    );
  }

  if (trip.userId === userId) {
    return NextResponse.json(
      { error: "You are the organizer of this trip." },
      { status: 400 }
    );
  }

  const existing = await prisma.joinRequest.findFirst({
    where: {
      userId,
      tripId,
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "You have already submitted a request for this trip.",
        status: existing.status,
      },
      { status: 409 }
    );
  }

  if (trip.currentParticipants >= trip.maxParticipants) {
    return NextResponse.json(
      { error: "This trip is already full." },
      { status: 400 }
    );
  }

  const joinRequest = await prisma.joinRequest.create({
    data: {
      userId,
      tripId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      trip: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return NextResponse.json(joinRequest, { status: 201 });
}

// ─────────────────────────────────────────────────────────────
// GET /api/trips/:id/join-requests
// Organizer fetches all pending applicants
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = id;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found." },
      { status: 404 }
    );
  }

  if (trip.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the organizer can view applicants." },
      { status: 403 }
    );
  }

  const requests = await prisma.joinRequest.findMany({
    where: {
      tripId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(requests, { status: 200 });
}