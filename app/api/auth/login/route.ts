import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/src/lib/validators/login";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    //  Validate input
    const data = loginSchema.parse(body);

    //  Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    //  Compare password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
  console.log("LOGIN ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      error: error.message || error,
    },
    { status: 400 }
  );
}

}
