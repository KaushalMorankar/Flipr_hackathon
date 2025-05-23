// app/api/company/register/route.ts
import { NextRequest } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Create company and admin user in one transaction
    const company = await prisma.company.create({
      data: {
        name: body.name,
        subdomain: body.subdomain,
        users: {
          create: {
            email: body.email,
            password: body.password, // In real app, hash password
            role: 'ADMIN'
          }
        }
      },
      include: {
        users: true
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      company,
      message: 'Company registered successfully'
    }), { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Registration failed'
    }), { status: 500 });
  }
}