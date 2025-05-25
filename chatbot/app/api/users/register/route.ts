// app/api/user/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs'; // ✅ Import bcrypt

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyId } = await req.json();

    if (!email || !password || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Step 2: Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds salt

    // Step 3: Create user with hashed password
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // ✅ Use hashed password
        role: 'CUSTOMER', // Update to match your actual role enum
        company: { connect: { id: companyId } }
      }
    });

    // Step 4: Return sanitized user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error.message);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}