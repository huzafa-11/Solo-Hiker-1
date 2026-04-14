// FILE PATH: app/api/trips/[tripId]/join-requests/route.ts
// Handles: POST (user requests to join a trip)
//          GET  (organizer fetches all pending applicants)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth"; // adjust to your auth config path
import { prisma } from "@/src/lib/prisma";   // adjust to your prisma client path

// ─────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/join-requests
// Who can call: any authenticated user (not the organizer)
// What it does: creates a PENDING join request for the trip
// ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth guard — must be logged in
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const tripId = params.id;

  // 2. Load the trip — must exist
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found." },
      { status: 404 }
    );
  }

  // 3. Organizer cannot request to join their own trip
  if (trip.userId === userId) {
    return NextResponse.json(
      { error: "You are the organizer of this trip." },
      { status: 400 }
    );
  }

  // 4. Check for existing request (belt-and-suspenders — DB @@unique also enforces this)
  const existing = await (prisma as any).joinRequest.findFirst({
    where: {
      userId,
      tripId,
    },
  });

  if (existing) {
    // If they were previously rejected, you could allow re-apply here.
    // For now we block any duplicate regardless of status.
    return NextResponse.json(
      {
        error: "You have already submitted a request for this trip.",
        status: existing.status,
      },
      { status: 409 }
    );
  }

  // 5. Check if trip is full (soft check — hard check is in the accept endpoint)
  if (trip.currentParticipants >= trip.maxParticipants) {
    return NextResponse.json(
      { error: "This trip is already full." },
      { status: 400 }
    );
  }

  // 6. Create the join request with PENDING status
  const joinRequest = await (prisma as any).joinRequest.create({
    data: {
      userId,
      tripId,
      status: "PENDING",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      trip: {
        select: { id: true, title: true },
      },
    },
  });

  // 7. (Optional) Notify the organizer here — e.g. send email or create a Notification record
  // await notifyOrganizer(trip.organizerId, joinRequest);

  return NextResponse.json(joinRequest, { status: 201 });
}

// ─────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/join-requests
// Who can call: only the trip organizer
// What it does: returns all PENDING applicants for the trip
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  // 1. Auth guard
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const { tripId } = params;

  // 2. Load trip and check organizer identity
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  if (trip.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the organizer can view applicants." },
      { status: 403 }
    );
  }

  // 3. Fetch all PENDING requests ordered by submission time (oldest first = fair queue)
  const requests = await (prisma as any).joinRequest.findMany({
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
          image: true, // for showing avatar in the UI
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(requests, { status: 200 });
}