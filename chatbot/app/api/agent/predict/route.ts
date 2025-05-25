// app/api/agent/predict/route.ts
import { NextRequest,NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { decodeJWT } from '@/lib/jwt';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subdomain } = body;

  // Fetch historical data
  const company = await prisma.company.findUnique({
    where: { subdomain },
    include: {
      tickets: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: { messages: true }
      }
    }
  });

  const tickets = company?.tickets || [];
  const recentSubjects = tickets.slice(-5).map(t => t.subject);
  const commonTags = ['billing', 'login', 'shipping', 'technical', 'account'];
  const tagCounts = commonTags.map(tag => ({
    tag,
    count: tickets.filter(t => t.subject.toLowerCase().includes(tag)).length
  }));

  // Build prediction prompt
  const prompt = `
You're an AI assistant analyzing support data for ${subdomain}.yourapp.com.
Based on recent tickets and trends, predict:
- Likely ticket volume next week
- Potential bottlenecks
- Emerging issues

Recent Tickets:
${recentSubjects.join('\n')}
Common Tags:
${tagCounts.map(t => `${t.tag}: ${t.count} tickets`).join('\n')}

Use bullet points and keep it concise.
  `;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  const prediction = result.response.text();
  return NextResponse.json({ prediction }, { status: 200 });
}