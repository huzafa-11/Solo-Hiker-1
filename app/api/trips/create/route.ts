// src/app/api/trips/create/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { uploadMultipleImages } from "@/src/lib/cloudinary";

export async function POST(req: Request) {
  try {
    // Auth + body parse in parallel — saves ~50-80ms
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      req.json(),
    ]);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      difficulty,
      maxParticipants,
      images,
      isPublic,
    } = body;

    // Fast fail before any DB/upload work
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Image upload + user lookup in parallel — saves ~200-400ms
    const [imageUrls, user] = await Promise.all([
      images?.length
        ? uploadMultipleImages(images).catch((err: Error) => {
            throw Object.assign(err, { isUploadError: true });
          })
        : Promise.resolve([] as string[]),
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }, // only fetch what you need
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        difficulty,
        maxParticipants,
        currentParticipants: 1,
        images: imageUrls,
        isPublic: isPublic ?? true,
        userId: user.id,
        participants: [user.id],
      } as any,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, message: "Trip created successfully", trip },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.isUploadError) {
      return NextResponse.json(
        { success: false, message: `Image upload failed: ${error.message}` },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Trip creation failed", error: error.message },
      { status: 500 }
    );
  }
}