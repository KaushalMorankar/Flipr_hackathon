// app/api/company/register/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const company = await prisma.company.create({
      data: {
        name: body.name,
        subdomain: body.subdomain,
        users: {
          create: {
            email: body.email,
            password: body.password, // In production, hash this
            role: 'ADMIN'
          }
        }
      },
      include: {
        users: true
      }
    });

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Company creation failed' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, company }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error || 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'Registration failed' }),
      { status: 500 }
    );
  }
}