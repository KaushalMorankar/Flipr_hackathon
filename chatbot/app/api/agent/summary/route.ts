// app/api/agent/summary/route.ts
import { NextRequest,NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { decodeJWT } from '@/lib/jwt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { timeframe, subdomain } = body;

  // Get tickets
  const company = await prisma.company.findUnique({
    where: { subdomain },
    include: { tickets: true }
  });

  const tickets = company?.tickets || [];

  // Build prompt
  const prompt = `
You're an AI assistant analyzing customer support data.
Generate a ${timeframe} summary for ${subdomain}.yourapp.com.
Metrics:
- Total Tickets: ${tickets.length}
- Resolved: ${tickets.filter(t => t.status === 'RESOLVED').length}
- Open: ${tickets.filter(t => t.status === 'OPEN').length}

Highlight:
- Key trends
- Emerging issues
- Areas needing attention

Use bullet points and keep it concise.
  `;

  // Generate summary
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  const summary = result.response.text();
  return NextResponse.json({ summary }, { status: 200 });
}