// app/api/customer/chat/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
export async function POST(req: NextRequest) {
  const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL;

  if (!PYTHON_BACKEND_URL) {
    console.error('PYTHON_BACKEND_URL not set');
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }

  try {
    const { message, companyId, sessionId } = await req.json();

    if (!message || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Step 1: Escalate to ticket
    if (message.toLowerCase() === 'escalate') {
  const ticket = await createTicket(companyId, message, sessionId);
  return new Response(JSON.stringify(ticket), { status: 200 });
}

    // Step 2: Forward to Python backend
    const pythonResp = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, companyId, sessionId })
    });

    if (!pythonResp.ok) {
      const errorText = await pythonResp.text();
      console.error('Python backend error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Chat service unavailable' }),
        { status: 500 }
      );
    }

    const pythonData = await pythonResp.json();
    return new Response(JSON.stringify(pythonData), { status: 200 });

  } catch (error: any) {
    console.error('Chat error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat' }),
      { status: 500 }
    );
  }
}

// ✅ Create ticket with valid companyId
async function createTicket(companyId: string, message: string, sessionId: string) {
  if (!companyId || !message) {
    throw new Error('Missing required fields');
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject: `Escalated Chat: ${message.slice(0, 30)}...`,
      status: 'OPEN',
      companyId,
      messages: {
        create: {
          content: message,
          role: 'USER',
          senderId: sessionId
        }
      }
    },
    include: { messages: true }
  });

  return {
    response: 'Your request has been escalated to an agent.',
    ticketId: ticket.id,
    status: ticket.status
  };
}