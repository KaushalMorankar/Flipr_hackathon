// lib/responseSuggester.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function suggestAgentResponse(suggestions: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `
You're an AI assistant helping customer support agents draft responses.
Use the knowledge base and past tickets to suggest a response.

Knowledge Base Matches:
${suggestions.kbResults.join('\n')}

Past Ticket Matches:
${suggestions.pastTickets.map((t: any) => t.subject).join('\n')}

Suggest a concise, professional response to the customer.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512 }
    });

    return result.response.text() || 'No suggestion generated.';
  } catch (error) {
    console.error('AI response error:', error);
    return 'Error generating response.';
  }
}

// app/lib/responseSuggester.ts
export async function fetchAgentResponse(suggestions: any) {
  const res = await fetch('/api/generate/response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestions })
  });
  const data = await res.json();
  return data.response;
}