// FILE PATH: app/api/join-requests/[id]/route.ts
// Handles: PATCH (organizer accepts or rejects a specific join request)
//
// CONCURRENCY SAFETY:
//   The ACCEPTED path uses prisma.$transaction() to ensure that the seat
//   check and the seat increment happen atomically. If two organizers (or
//   two browser tabs) hit accept at the same time on the last seat, only
//   one will succeed — the other gets a 409 "Trip is now full" error.
//
// NOTE FOR MONGODB USERS:
//   prisma.$transaction() requires a MongoDB Replica Set.
//   MongoDB Atlas → you are fine by default.
//   Local MongoDB → start with --replSet flag or use a replica set config.

/*import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";

// Valid status values the organizer can set
type DecisionStatus = "ACCEPTED" | "REJECTED";

// ─────────────────────────────────────────────────────────────
// PATCH /api/join-requests/:id
// Body: { status: "ACCEPTED" | "REJECTED" }
// Who can call: the organizer of the trip this request belongs to
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth guard
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  // 2. Parse and validate request body
  let body: { status?: DecisionStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { status } = body;

  if (status !== "ACCEPTED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "Status must be 'ACCEPTED' or 'REJECTED'." },
      { status: 400 }
    );
  }

  // 3. Load the join request + the trip it belongs to
  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: params.id },
    include: {
      trip: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!joinRequest) {
    return NextResponse.json(
      { error: "Join request not found." },
      { status: 404 }
    );
  }

  // 4. Only the organizer of THIS trip can accept/reject
  if (joinRequest.trip.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden. Only the trip organizer can do this." },
      { status: 403 }
    );
  }

  // 5. Can only act on PENDING requests
  if (joinRequest.status !== "PENDING") {
    return NextResponse.json(
      {
        error: `This request has already been ${joinRequest.status.toLowerCase()}.`,
        currentStatus: joinRequest.status,
      },
      { status: 409 }
    );
  }

  // ─────────────────────────────────────────────────────────
  // REJECTED path — simple update, no seat change needed
  // ─────────────────────────────────────────────────────────
  if (status === "REJECTED") {
    const updated = await prisma.joinRequest.update({
      where: { id: params.id },
      data: { status: "REJECTED" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        trip: { select: { id: true, title: true } },
      },
    });

    // (Optional) notify the user they were rejected
    // await notifyUser(joinRequest.userId, "Your request was rejected.");

    return NextResponse.json(updated, { status: 200 });
  }

  // ─────────────────────────────────────────────────────────
  // ACCEPTED path — wrapped in a transaction for concurrency safety
  //
  // The problem we are solving:
  //   Thread A reads: currentMembers=9, maxCapacity=10 → ok
  //   Thread B reads: currentMembers=9, maxCapacity=10 → ok
  //   Thread A writes: ACCEPTED, currentMembers=10
  //   Thread B writes: ACCEPTED, currentMembers=11  ← OVERBOOKING BUG
  //
  // The fix:
  //   Both checks AND both writes happen inside one atomic transaction.
  //   Thread B has to wait for Thread A to finish. When it gets the lock,
  //   it re-reads currentMembers=10 and throws TRIP_FULL before writing.
  // ─────────────────────────────────────────────────────────
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Step 1: Re-read the trip INSIDE the transaction for a fresh seat count
      const freshTrip = await tx.trip.findUnique({
        where: { id: joinRequest.tripId },
      });

      if (!freshTrip) {
        throw new Error("TRIP_NOT_FOUND");
      }

      // Step 2: Hard seat check — if full, abort the whole transaction
      if (freshTrip.currentParticipants >= freshTrip.maxParticipants) {
        throw new Error("TRIP_FULL");
      }

      // Step 3: Mark the join request as ACCEPTED
      const updatedRequest = await tx.joinRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          trip: { select: { id: true, title: true, currentParticipants: true, maxParticipants: true } },
        },
      });

      // Step 4: Increment the trip's member count atomically.
      //   { increment: 1 } compiles to: SET currentParticipants = currentParticipants + 1
      //   This is safe — no read-then-write, just a single atomic DB operation.
      await tx.trip.update({
        where: { id: joinRequest.tripId },
        data: { currentParticipants: { increment: 1 } },
      });

      return updatedRequest;
    });

    // (Optional) notify the user they were accepted
    // await notifyUser(joinRequest.userId, "Your request was accepted!");

    return NextResponse.json(result, { status: 200 });

  } catch (err: unknown) {
    const error = err as Error;

    if (error.message === "TRIP_FULL") {
      return NextResponse.json(
        {
          error: "Trip is now full. Another applicant was just accepted.",
          code: "TRIP_FULL",
        },
        { status: 409 }
      );
    }

    if (error.message === "TRIP_NOT_FOUND") {
      return NextResponse.json(
        { error: "Trip no longer exists." },
        { status: 404 }
      );
    }

    // Unexpected error — rethrow so Next.js error handling catches it
    console.error("[join-request PATCH] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
*/

// FILE PATH: app/api/join-requests/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";

// NOTE: Your schema uses APPROVED (not ACCEPTED) — enum JoinStatus { PENDING, APPROVED, REJECTED }
type DecisionStatus = "APPROVED" | "REJECTED";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  


  // Parse body
  let body: { status?: DecisionStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { status } = body;
  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "Status must be 'APPROVED' or 'REJECTED'." },
      { status: 400 }
    );
  }

  // Resolve user from session
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });


  // Load join request + trip
  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id:id },
    include: { trip: true },
  });
  if (!joinRequest) return NextResponse.json({ error: "Join request not found." }, { status: 404 });

  // Only the trip organizer can act — schema uses trip.userId
  if (joinRequest.trip.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Can only act on PENDING requests
  if (joinRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: `This request is already ${joinRequest.status.toLowerCase()}.`, currentStatus: joinRequest.status },
      { status: 409 }
    );
  }

  // ── REJECTED — simple update, no seat change ──────────────
  if (status === "REJECTED") {
    const updated = await prisma.joinRequest.update({
      where: { id:id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ success: true, joinRequest: updated }, { status: 200 });
  }

  // ── APPROVED — transaction with concurrency seat check ────
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Re-read trip inside transaction for a fresh seat count
      const freshTrip = await tx.trip.findUnique({
        where: { id: joinRequest.tripId },
      });
      if (!freshTrip) throw new Error("TRIP_NOT_FOUND");

      // Hard seat check — uses currentParticipants / maxParticipants
      if (freshTrip.currentParticipants >= freshTrip.maxParticipants) {
        throw new Error("TRIP_FULL");
      }

      // Mark as APPROVED
      const updatedRequest = await tx.joinRequest.update({
        where: { id:id },
        data: { status: "APPROVED" },
      });

      // Keep the participants array in sync with the counter used by the detail page.
      await tx.trip.update({
        where: { id: joinRequest.tripId },
        data: {
          currentParticipants: { increment: 1 },
          participants: { push: joinRequest.userId },
        },
      });

      return updatedRequest;
    });

    return NextResponse.json({ success: true, joinRequest: result }, { status: 200 });

  } catch (err: unknown) {
    const error = err as Error;

    if (error.message === "TRIP_FULL") {
      return NextResponse.json(
        { error: "Trip is now full. Another applicant was just approved.", code: "TRIP_FULL" },
        { status: 409 }
      );
    }
    if (error.message === "TRIP_NOT_FOUND") {
      return NextResponse.json({ error: "Trip no longer exists." }, { status: 404 });
    }

    console.error("[join-request PATCH] Unexpected error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
