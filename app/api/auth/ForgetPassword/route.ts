import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { forgetPassSchema } from "@/src/lib/validators/forget_pass";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = forgetPassSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email does not exist",
        },
        { status: 404 }
      );
    }

    // Mock reset link logic
    console.log(`Mock reset link sent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Reset link sent successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.errors ?? "Invalid request",
      },
      { status: 400 }
    );
  }
}
