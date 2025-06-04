// // app/api/user/login/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import bcrypt from 'bcryptjs';

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password } = await req.json();

//     // Step 1: Validate input
//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password required' },
//         { status: 400 }
//       );
//     }

//     // Step 2: Find user by email and role
//     const user = await prisma.user.findUnique({
//       where: {
//         email,
//         role: 'CUSTOMER' // ✅ Use correct role from your schema
//       }
//     });
    
//     // Step 3: Check if user exists
//     if (!user) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Step 4: Compare password with hash
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Step 5: Return sanitized user data (no password)
//     return NextResponse.json({
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         companyId: user.companyId
//       }
//     }, { status: 200 });

//   } catch (error: any) {
//     console.error('Login error:', error.message);
//     return NextResponse.json(
//       { error: 'Login failed' },
//       { status: 500 }
//     );
//   }
// }


// app/api/user/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "97a9e10a5c110bfc771f5a8434da1ae45f8ff95521e75fe5f1fd9b6109f990dd1c0a9b364d876b8829757400aa7c253570226754b3fc60982cd138ead6ad6884";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1) Simple validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // 2) Look up user by email
    //    (We assume `email` is unique in your Prisma schema.)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3) If no user or wrong role, bail out
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 4) Check password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 5) At this point, credentials are valid. Generate a JWT payload.
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    // 6) Prepare the JSON body you want to send back.
    //    (We omit `password` or any other sensitive fields.)
    const responseBody = {
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };

    // 7) Create a NextResponse and set‐cookie
    const response = NextResponse.json(responseBody, { status: 200 });

    // ‣ In development (HTTP), you might need secure: false. In production (HTTPS), set secure: true.
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", 
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
