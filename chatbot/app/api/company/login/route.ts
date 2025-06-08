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
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are both required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = generateJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      subdomain: user.company.subdomain,
    });

    const cookie = `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; HttpOnly; SameSite=Strict`;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          subdomain: user.company.subdomain,
        },
      },
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again later." },
      { status: 500 }
    );
  }
}
