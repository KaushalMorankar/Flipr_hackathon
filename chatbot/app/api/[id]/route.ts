// app/api/[id]/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, subdomain: true }
  });

  if (!company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(company), { status: 200 });
}