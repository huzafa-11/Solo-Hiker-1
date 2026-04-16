// FILE PATH: app/api/trips/pending-count/route.ts
// Returns the total number of PENDING join requests across all trips the user organizes.
// Used by the sidebar to show the badge on "My Trips".

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) return NextResponse.json({ count: 0 });

    // Count all PENDING join requests on trips this user organizes
    const count = await prisma.joinRequest.count({
      where: {
        trip: { userId: user.id },
        status: "PENDING",
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}