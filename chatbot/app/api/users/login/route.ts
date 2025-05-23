// app/api/user/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findFirst({
    where: {
      email,
      password, // hash this in production!
      role: 'USER',
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
    },
  });
}
