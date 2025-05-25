// app/api/customer/escalate/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
export async function POST(req: NextRequest) {
  try {
    const { message, companyId, sessionId } = await req.json();

    if (!companyId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // ✅ Create ticket with required fields
    const ticket = await prisma.ticket.create({
      data: {
        subject: `Escalated Chat: ${message.slice(0, 30)}...`,
        status: 'OPEN',
        companyId,
        priority: 10, // ✅ Set default priority
        messages: {
          create: {
            content: message,
            role: 'USER',
            senderId: null // ✅ No senderId if not logged in
          }
        }
      },
      include: { messages: true }
    });

    return new Response(
      JSON.stringify({
        response: 'Your request has been escalated to an agent.',
        ticketId: ticket.id,
        status: ticket.status
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Escalation error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to escalate chat' }),
      { status: 500 }
    );
  }
}