import { NextResponse } from "next/server";
import { registerSchema } from "@/src/lib/validators/register";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
export async function POST(req: Request) {
  try {
    // STEP 1: Get the data from the request
    // req.json() reads the JSON data sent from the frontend
    const body = await req.json();
    console.log(" Received registration data:", body);

    // STEP 2: Validate the data with Zod
    // safeParse() checks if the data matches our schema
    // It returns { success: true, data: ... } or { success: false, error: ... }
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      // Validation failed - send back the errors
      console.log(" Validation failed:", result.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          error: result.error.issues, // Array of field errors
        },
        { status: 400 } // 400 = Bad Request
      );
    }

    // STEP 3: Extract the validated data
    const data = result.data;
    console.log(" Data validated successfully");

    // STEP 4: Check if email already exists
    // We don't want duplicate emails in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log(" Email already exists");
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 400 }
      );
    }

    // STEP 5: Hash the password
    // NEVER store passwords in plain text!
   // Even if someone steals your database, they can't read passwords
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log(" Password hashed");
    // STEP 6: Create the user in the database
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        age: data.age,
        password: hashedPassword, // Store HASHED password, not plain text
      },
      // Only select the fields we want to return
      // DON'T return the password!
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        createdAt: true,
      },
    });

    console.log(" User created successfully:", user.id);

    // STEP 7: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 } // 201 = Created
    );
  } catch (error: any) {
    // STEP 8: Handle any unexpected errors
    console.error(" Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message || "Something went wrong",
      },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}
