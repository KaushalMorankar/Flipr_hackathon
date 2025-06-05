// File: app/api/agent/predict/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import type { Ticket } from '@prisma/client'; // ← Import the Ticket type

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subdomain } = body;

  // Fetch the last 7 days of tickets (including their messages)
  const company = await prisma.company.findUnique({
    where: { subdomain },
    include: {
      tickets: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
        include: { messages: true },
      },
    },
  });

  // Ensure we have an array of Ticket objects (or empty array)
  const tickets: Ticket[] = company?.tickets || [];

  // Pull the “subject” field from the five most recent tickets:
  //    use .slice(-5) to get last 5 items, then .map((t: Ticket) => ...)
  const recentSubjects: string[] = tickets
    .slice(-5)
    .map((t: Ticket) => t.subject);

  // Count how many tickets mention each common tag
  const commonTags = ['billing', 'login', 'shipping', 'technical', 'account'];
  const tagCounts = commonTags.map((tag) => ({
    tag,
    count: tickets.filter((t: Ticket) =>
      t.subject.toLowerCase().includes(tag)
    ).length,
  }));
  // console.log(recentSubjects,commonTags);
  // Build the prompt for the AI model
  const prompt = `
You're an AI assistant analyzing support data for ${subdomain}.yourapp.com.
Based on recent tickets and trends, predict:
- Likely ticket volume next week
- Potential bottlenecks
- Emerging issues

Recent Tickets:
${recentSubjects.join('\n')}

Common Tags:
${tagCounts.map((t) => `${t.tag}: ${t.count} tickets`).join('\n')}

Use bullet points and keep it concise.
  `;

  // Call Gemini (flash tier) with the constructed prompt
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  // Extract the text response
  const prediction = result.response.text();
  return NextResponse.json({ prediction }, { status: 200 });
}
