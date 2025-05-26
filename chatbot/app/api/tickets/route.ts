// app/api/tickets/route.ts

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { Pinecone } from '@pinecone-database/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, subdomain } = await req.json();

    // 1) Lookup company and its users
    const company = await prisma.company.findUnique({
      where: { subdomain },
      include: { users: true }
    });
    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404 }
      );
    }

    // 2) Classify the ticket using Gemini
    const classificationModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const classificationResult = await classificationModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Classify this ticket:\n"${message}"\n\n`
            + `Return JSON: {category: "billing|technical|account|shipping", priority: 1-5}`
        }]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const classification = JSON.parse(
      classificationResult.response.text() || '{}'
    ) as { category?: string; priority?: number };

    // 3) Create the ticket (with the user’s initial message)
    const ticket = await prisma.ticket.create({
      data: {
        companyId: company.id,
        subject: message.slice(0, 100),
        status: 'OPEN',
        priority: classification.priority ?? 3,
        messages: {
          create: {
            content: message,
            role: 'user',
            embedding: []
          }
        }
      },
      include: { messages: true }
    });

    // 4) Generate an embedding for that message
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    // — either of these two calls is valid:
    // const embeddingResult = await embeddingModel.embedContent(message);
    const embeddingResult = await embeddingModel.embedContent({ content: message });

    // 5) Update the newly created message with its embedding
    await prisma.ticketMessage.update({
      where: { id: ticket.messages[0].id },
      data: {
        embedding: { set: embeddingResult.embedding.values }
      }
    });

    // 6) Assign it to the least-burdened agent
    const agentUpdate = await assignTicketToAgent(ticket.id, company.id);

    // 7) Run any simple automations (e.g., password-reset)
    const automationResult = await runAutomation(ticket.id, message, company.id);

    return new Response(
      JSON.stringify({
        ticket,
        agent: agentUpdate,
        automation: automationResult
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Ticket creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create ticket' }),
      { status: 500 }
    );
  }
}

// -----------------------
// Agent assignment logic
// -----------------------
async function assignTicketToAgent(
  ticketId: string,
  companyId: string
) {
  type AgentWithTickets = { id: string; tickets: { id: string }[] };

  const agents = await prisma.user.findMany({
    where: { companyId, role: 'AGENT' },
    include: { tickets: { where: { status: 'IN_PROGRESS' } } }
  });

  const leastBusy = agents.sort(
    (a: AgentWithTickets, b: AgentWithTickets) =>
      a.tickets.length - b.tickets.length
  )[0];

  if (!leastBusy) return null;

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'IN_PROGRESS',
      agentId: leastBusy.id
    }
  });
}

// -----------------------
// Automation logic
// -----------------------
export async function runAutomation(
  ticketId: string,
  message: string,
  companyId: string
): Promise<{ resolved: boolean; reason?: string }> {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  // e.g. auto-resolve password-reset requests
  if (
    message.toLowerCase().includes('password')
    || message.toLowerCase().includes('reset')
  ) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        messages: {
          create: {
            content: 'Your password has been reset.',
            role: 'assistant'
          }
        }
      }
    });
    return { resolved: true, reason: 'Password reset' };
  }

  // add more automations here…

  return { resolved: false };
}
