import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const user = await  prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const updated = await prisma.trip.updateMany({
      where: {
        id: params.id,

        //  Trip not full
        currentParticipants: {
          lt: prisma.trip.fields.maxParticipants, // ⚡ dynamic field comparison
        },

        //  User not already in participants
        NOT: {
          participants: {
            has: user.id,
          },
        },
      },
      data: {
        currentParticipants: { increment: 1 },
        participants: { push: user.id },
      },
    });

    // If update failed
    if (updated.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Trip full or already joined",
        },
        { status: 400 }
      );
    }

    //  Fetch updated trip 
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      trip,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}