import { NextRequest, NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password, companyId } = await req.json();

  if (!email || !password || !companyId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password, // hash in production!
      role: 'USER',
      company: { connect: { id: companyId } },
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
    },
  });
}
