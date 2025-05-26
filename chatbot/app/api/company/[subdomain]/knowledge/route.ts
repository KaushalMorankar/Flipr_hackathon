// app/api/company/[subdomain]/knowledge/route.ts
import { NextRequest } from 'next/server';
import prisma  from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { subdomain: params.subdomain },
      include: { knowledgeBase: true }
    });

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(company.knowledgeBase), { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch knowledge base' }), { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    const body = await req.json();
    
    // First get company ID
    const company = await prisma.company.findUnique({
      where: { subdomain: params.subdomain }
    });

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
    }

    // Generate embedding using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent({
      content: { text: body.content }
    });
    const embedding = result.embedding.values;

    // Save to database with embedding
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: body.title,
        content: body.content,
        embeddings: embedding,
        companyId: company.id
      }
    });

    return new Response(JSON.stringify(knowledge), { status: 201 });
  } catch (error) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save knowledge entry' }), { status: 500 });
  }
}