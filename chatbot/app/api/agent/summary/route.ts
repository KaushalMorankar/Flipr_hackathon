// app/api/agent/summary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { decodeJWT } from '@/lib/jwt';
import type { Ticket } from '@prisma/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { timeframe, subdomain } = await req.json();

  // 1) Fetch company and its tickets
  const company = await prisma.company.findUnique({
    where: { subdomain },
    include: { tickets: true }
  });

  if (!company) {
    return NextResponse.json(
      { error: `Company with subdomain "${subdomain}" not found` },
      { status: 404 }
    );
  }

  // 2) Explicitly type your tickets array
  const tickets: Ticket[] = company.tickets;

  // 3) Compute your metrics
  const totalCount   = tickets.length;
  const resolvedCount = tickets.filter(
    (t: Ticket) => t.status === 'RESOLVED'
  ).length;
  const openCount     = tickets.filter(
    (t: Ticket) => t.status === 'OPEN'
  ).length;

  // 4) Build the prompt
  const prompt = `
You’re an AI assistant analyzing customer support data.
Generate a ${timeframe} summary for ${subdomain}.yourapp.com.

Metrics:
- Total Tickets: ${totalCount}
- Resolved: ${resolvedCount}
- Open: ${openCount}

Highlight:
- Key trends
- Emerging issues
- Areas needing attention

Use bullet points and keep it concise.
  `;

  // 5) Call Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });

  // 6) Return the AI’s summary
  const summary = result.response.text();
  return NextResponse.json({ summary }, { status: 200 });
}
