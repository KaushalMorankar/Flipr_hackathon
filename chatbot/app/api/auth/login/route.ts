// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Step 1: Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Step 2: Find user with company
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Step 3: Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 4: Validate company subdomain
    if (!user.company || !user.company.subdomain) {
      return NextResponse.json(
        { error: 'Company subdomain not set' },
        { status: 500 }
      );
    }

    // Step 5: Generate JWT with subdomain
    const token = generateJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      subdomain: user.company.subdomain // ✅ Use company.subdomain
    });

    // Step 6: Set cookie
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          subdomain: user.company.subdomain
        }
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict`
        }
      }
    );

  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}