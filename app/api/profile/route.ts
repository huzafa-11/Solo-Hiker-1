import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { updateProfileSchema } from "@/src/lib/validators/update";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        cnic: data.cnic,
        hikingLevel: data.hikingLevel,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        cnic: updatedUser.cnic,
        hikingLevel: updatedUser.hikingLevel,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.errors ?? "Something went wrong",
      },
      { status: 400 }
    );
  }
}

