// app/api/chatbot/route.ts
import { NextRequest } from 'next/server';
import { initializeGemini } from '@/lib/gemini';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';

const geminiModel = initializeGemini();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ Proper Pinecone v6+ setup
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index(process.env.PINECONE_INDEX!);

export async function POST(req: NextRequest) {
  try {
    const { message, companyId } = await req.json();

    // ✅ Embed message using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent(message); // ✅ Correct format
    const queryEmbedding = result.embedding.values;

    // ✅ Search knowledge base
    const context = await searchKnowledgeBase(companyId, queryEmbedding);

    // ✅ Build prompt
    const fullPrompt = `
You are a customer support assistant for company ID: ${companyId}
Use the following knowledge base to answer:
${context}

Customer question: "${message}"
Answer in a friendly, professional tone:
    `;

    // ✅ Generate response
    const response = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    });

    const reply = response.response.text() || "No response from Gemini.";
    return new Response(JSON.stringify({ reply }), { status: 200 });

  } catch (error) {
    console.error('Gemini error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
  }
}

// ✅ Pinecone query function
async function searchKnowledgeBase(companyId: string, queryEmbedding: number[]) {
  const results = await index.query({
    vector: queryEmbedding,
    topK: 3,
    includeMetadata: true,
    filter: { companyId }
  });

  return results.matches
    ?.map(m => m.metadata?.text || '')
    .join('\n') || 'No relevant context found.';
}
