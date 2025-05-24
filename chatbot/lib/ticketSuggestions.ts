// lib/ticketSuggestions.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import  prisma  from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export async function getTicketSuggestions(ticketId: string, subdomain: string) {
  try {
    // Get latest message
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    const message = ticket.messages[0].content;

    // Search knowledge base
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const kbResults = await index.namespace(subdomain).query({
      vector: await getEmbedding(message),
      topK: 3,
      includeMetadata: true
    });

    // Search past tickets
    const pastTickets = await prisma.ticket.findMany({
      where: {
        companyId: (await prisma.company.findUnique({ where: { subdomain } }))?.id,
        messages: {
          some: { content: { contains: message, mode: 'insensitive' } }
        }
      },
      take: 3
    });

    return {
      kbResults: kbResults.matches.map(m => m.metadata?.text || ''),
      pastTickets
    };
  } catch (error) {
    console.error('Ticket suggestion error:', error);
    return { kbResults: [], pastTickets: [] };
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' }
  });
  return result.embedding.values;
}

// app/lib/ticketSuggestions.ts
export async function fetchSuggestions(subdomain: string, query: string) {
  const res = await fetch('/api/pinecone/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, subdomain })
  });
  return await res.json();                
  
}