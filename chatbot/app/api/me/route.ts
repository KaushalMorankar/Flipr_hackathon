// GET /api/company/me
import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFromToken } from '@/lib/auth'; // assume this exists
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyFromToken(req); // extract from cookie or header
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { users: true }
    });

    return NextResponse.json({ company });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
