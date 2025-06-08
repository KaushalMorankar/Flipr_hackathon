// app/api/customer/escalate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

type EscalatePayload = {
  companyId?: string;
  sessionId?: string;
  conversation?: Array<{
    role: 'user' | 'bot';
    text: string;
  }>;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  subject?: string;
  priority?: number;
};

export async function POST(req: NextRequest) {
  try {
    // 1) Parse the JSON body
    const body = (await req.json()) as EscalatePayload;
    console.log('📝  Received payload:', JSON.stringify(body, null, 2));

    const { companyId, sessionId, conversation, status, subject, priority } = body;

    // 2) Validate required fields
    if (
      !companyId ||
      !sessionId ||
      !Array.isArray(conversation) ||
      conversation.length === 0
    ) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing companyId, sessionId, or non-empty conversation array',
        }),
        { status: 400 }
      );
    }

    // 3) Verify that the company actually exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return new NextResponse(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404 }
      );
    }

    // 4) Build the nested‐create array of Message objects
    const messagesToCreate = conversation.map((msg) => ({
      content: msg.text,
      // Prisma.Message.role is a String, so we map 'user' → 'USER', 'bot' → 'ASSISTANT'
      role: msg.role === 'user' ? 'USER' : 'ASSISTANT',
      // If the sender is the “user,” we attach sessionId; if it’s the bot, we leave senderId null.
      senderId: msg.role === 'user' ? sessionId : null,
    }));

    // 5) Determine which TicketStatus to use.
    //    We imported `TicketStatus` directly above, so Object.values(TicketStatus) is guaranteed to be valid.
    const validStatuses = new Set(Object.values(TicketStatus));
    const ticketStatus: TicketStatus =
      status && validStatuses.has(status)
        ? (status as TicketStatus)
        : TicketStatus.OPEN;

    console.log('✨  Resolved ticketStatus =', ticketStatus);
    console.log(companyId);
    // 6) Create the Ticket + nested Messages in one call
    const ticket = await prisma.ticket.create({
      data: {
        subject:
          subject ?? `Escalated Chat: ${conversation[0]?.text.slice(0, 30)}...`,
        status: ticketStatus,
        priority: priority ?? 10,
        companyId: companyId,
        messages: {
          create: messagesToCreate,
        },
      },
      include: { messages: true },
    });

    console.log('✅ Ticket created:', ticket);

    // 7) Return a 200 with the new ticket’s ID + status
    return new NextResponse(
      JSON.stringify({
        response: 'Your request has been escalated to an agent.',
        ticketId: ticket.id,
        status: ticket.status,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    // 8) If anything goes wrong, log the error and send a 500 + JSON error
    console.error('🔥  /escalate error:', err);

    return new NextResponse(
      JSON.stringify({ error: 'Failed to create escalation ticket' }),
      { status: 500 }
    );
  }
}
