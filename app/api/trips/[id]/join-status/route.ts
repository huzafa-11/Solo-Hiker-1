import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * GET /api/trips/[id]/join-status
 * Returns the current user's join request status for a specific trip
 * Response: { status: "PENDING" | "APPROVED" | "REJECTED" | null }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { status: null, message: "Not authenticated" },
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
        { status: null, message: "User not found" },
        { status: 404 }
      );
    }

    // Check for any join request (pending, approved, or rejected)
    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_tripId: {
          userId: user.id,
          tripId: id,
        },
      },
      select: { status: true },
    });

    // Return the status or null if no request exists
    return NextResponse.json({
      status: joinRequest?.status || null,
    });
  } catch (error: any) {
    console.error("[join-status]", error);
    return NextResponse.json(
      { status: null, message: error.message },
      { status: 500 }
    );
  }
}
