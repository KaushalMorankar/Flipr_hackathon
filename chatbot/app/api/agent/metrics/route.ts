// app/api/agent/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decodeJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const cookies = req.cookies;
  const token = cookies.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const decoded = decodeJWT(token);
  if (!decoded || decoded.role !== 'AGENT') {
    return NextResponse.json({ error: 'Agent role required' }, { status: 403 });
  }

  const companyId = decoded.companyId;

  // Fetch metrics
  const tickets = await prisma.ticket.findMany({
    where: { companyId },
    include: { messages: true }
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
  const openTickets = tickets.filter(t => t.status === 'OPEN').length;

  const resolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 'N/A';
  const backlog = openTickets;

  return NextResponse.json({
    totalTickets,
    resolvedTickets,
    resolutionRate,
    backlog
  }, { status: 200 });
}