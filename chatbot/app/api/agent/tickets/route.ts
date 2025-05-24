// app/api/agent/tickets/route.ts
import { NextRequest } from 'next/server';
import { decodeJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const decoded = decodeJWT(token);
  if (!decoded || decoded.role !== 'AGENT') {
    return new Response(JSON.stringify({ error: 'Agent role required' }), { status: 403 });
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      companyId: decoded.companyId,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    },
    include: {
      messages: true
    }
  });

  return new Response(JSON.stringify(tickets), { status: 200 });
}