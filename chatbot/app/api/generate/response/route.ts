// app/api/generate/response/route.ts
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { suggestions } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
You're an AI assistant helping customer support agents draft responses.
Use the knowledge base and past tickets below to suggest a response.

Knowledge Base Matches:
${suggestions.kbResults.map((kb: string) => `- ${kb}`).join('\n')}

Past Ticket Matches:
${suggestions.pastTickets.map((t: any) => `- ${t.subject}`).join('\n')}

Suggest a concise, professional response to the customer.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512 }
    });

    return new Response(JSON.stringify({
      response: result.response.text() || 'No suggestion generated'
    }), { status: 200 });
  } catch (error: any) {
    console.error('AI response error:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), { status: 500 });
  }
}