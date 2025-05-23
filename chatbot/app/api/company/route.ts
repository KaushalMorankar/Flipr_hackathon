// app/api/company/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    });

    // Ensure valid response
    if (!companies) {
      return new Response(
        JSON.stringify({ error: 'No companies found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(companies), { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error || 'Unknown error'); // Avoid logging null
    return new Response(
      JSON.stringify({ error: 'Failed to fetch companies' }),
      { status: 500 }
    );
  }
}