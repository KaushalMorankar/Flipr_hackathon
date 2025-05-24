// app/api/tickets/route.ts
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import  prisma  from '@/lib/prisma';
import { Pinecone } from '@pinecone-database/pinecone';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, subdomain } = body;

    // Step 1: Get company by subdomain
    const company = await prisma.company.findUnique({
      where: { subdomain },
      include: { users: true }
    });

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
    }

    // Step 2: Classify ticket with Gemini
    const classificationModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await classificationModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Classify this ticket:\n"${message}"\n\nReturn JSON: {category: "billing|technical|account|shipping", priority: 1-5}` }]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const classification = JSON.parse(result.response.text() || '{}');
    
    // Step 3: Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        companyId: company.id,
        subject: message.slice(0, 100),
        status: 'OPEN',
        priority: classification.priority || 3,
        messages: {
          create: {
            content: message,
            role: 'user',
            embedding: [] // Will be updated later
          }
        }
      },
      include: { messages: true }
    });

    // Step 4: Generate embedding for the message
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddingResult = await embeddingModel.embedContent({
      content: { text: message }
    });

    // Step 5: Update message with embedding
    await prisma.ticketMessage.update({
      where: { id: ticket.messages[0].id },
      data: {
        embedding: { set: embeddingResult.embedding.values }
      }
    });

    // Step 6: Assign agent
    const agent = await assignTicketToAgent(ticket.id, company.id);
    
    // Step 7: Run automation
    const automationResult = await runAutomation(ticket.id, message, company.id);

    return new Response(JSON.stringify({
      ticket,
      agent,
      automation: automationResult
    }), { status: 201 });
  } catch (error) {
    console.error('Ticket creation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create ticket' }), { status: 500 });
  }
}

// Agent assignment logic
async function assignTicketToAgent(ticketId: string, companyId: string) {
  const agents = await prisma.user.findMany({
    where: { companyId, role: 'AGENT' },
    include: {
      tickets: { where: { status: 'IN_PROGRESS' } }
    }
  });

  const agent = agents.sort((a, b) => a.tickets.length - b.tickets.length)[0];

  if (agent) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'IN_PROGRESS',
        agentId: agent.id
      }
    });
  }

  return null;
}

// Automation logic
export async function runAutomation(ticketId: string, message: string, companyId: string): Promise<{ resolved: boolean, reason?: string }> {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  // Example: Password reset
  if (message.includes('password') || message.includes('reset')) {
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

  return { resolved: false };
}