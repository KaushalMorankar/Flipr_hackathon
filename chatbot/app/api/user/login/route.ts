// app/api/user/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Step 1: Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Step 2: Find user by email and role
    const user = await prisma.user.findUnique({
      where: {
        email,
        role: 'CUSTOMER' // ✅ Use correct role from your schema
      }
    });
    
    // Step 3: Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 4: Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 5: Return sanitized user data (no password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}