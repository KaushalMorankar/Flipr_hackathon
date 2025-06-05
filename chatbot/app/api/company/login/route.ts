// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import bcrypt from 'bcryptjs';
// import { generateJWT } from '@/lib/jwt';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { email, password } = body;

//     // Step 1: Validate input
//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password required' },
//         { status: 400 }
//       );
//     }

//     // Step 2: Find user by email
//     const user = await prisma.user.findUnique({
//       where: { email },
//       include: { company: true }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Step 3: Compare password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Step 4: Generate JWT
//     const token = generateJWT({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       companyId: user.companyId
//     });

//     // Step 5: Set JWT in cookie
//     return NextResponse.json(
//       {
//         user: {
//           id: user.id,
//           email: user.email,
//           role: user.role,
//           companyId: user.companyId,
//           subdomain: user.company.subdomain
//         }
//       },
//       {
//         status: 200,
//         headers: {
//           'Set-Cookie': `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; HttpOnly; SameSite=Strict`
//         }
//       }
//     );

//   } catch (error: any) {
//     console.error('Login error:', error.message);
//     return NextResponse.json(
//       { error: 'Login failed' },
//       { status: 500 }
//     );
//   }
// }

// app/company/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateJWT } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1) Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are both required." },
        { status: 400 }
      );
    }

    // 2) Look up the user by email, including their company (so we can grab subdomain)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }, // ensures user.company is available
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 3) Compare the provided password to the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 4) Generate a JWT. The payload type for generateJWT expects:
    //    { id: string; email: string; role: string; companyId: string; subdomain: string; }
    //    so we must include `subdomain: user.company.subdomain`.
    const token = generateJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      subdomain: user.company.subdomain,
    });

    // 5) Set the JWT in an HttpOnly cookie
    //    - Path=/ makes it accessible on all routes
    //    - Max-Age=7 days (in seconds)
    //    - HttpOnly & SameSite=Strict for security
    //
    //    If you want the cookie to be scoped to a specific domain (e.g. ".yourapp.com"),
    //    you could add `Domain=.yourapp.com;` before `Path=/;`, but leaving it as
    //    `Path=/;` is fine if your frontend/API share the same base domain.
    const cookieValue = `auth_token=${token}; Path=/; Max-Age=${
      60 * 60 * 24 * 7
    }; HttpOnly; SameSite=Strict`;

    // 6) Return the user’s basic info + company subdomain so the client knows where to redirect
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          subdomain: user.company.subdomain, // e.g. "acme"
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieValue,
        },
      }
    );
  } catch (err: any) {
    console.error("Login error:", err.message);
    return NextResponse.json(
      { error: "Login failed. Please try again later." },
      { status: 500 }
    );
  }
}
