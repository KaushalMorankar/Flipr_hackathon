// app/api/company/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON input' },
        { status: 400 }
      );
    }

    const { name, subdomain, email, password } = body;
    
    // Step 1: Validate required fields
    if (!name || !subdomain || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 2: Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Step 3: Create company + admin user
    const company = await prisma.company.create({
      data: {
        name,
        subdomain,
        users: {
          create: {
            email,
            password: hashedPassword, // ✅ Use hashed password
            role: 'ADMIN'
          }
        }
      },
      include: {
        users: { select: { id: true, email: true, role: true } } // ✅ Exclude password
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    
    // Step 4: Handle unique constraint violations
    if (error.code === 'P2002' && error.meta?.target.includes('subdomain')) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}