// app/api/chatbot/route.ts
import { NextRequest } from 'next/server';
import { initializeGemini } from '@/lib/gemini';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PineconeClient } from "@pinecone-database/pinecone";
const geminiModel = initializeGemini();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, companyId } = await req.json();
    
    // Step 1: Generate embedding for the query
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent({
      content: { text: message }
    });
    const queryEmbedding = result.embedding.values;

    // Step 2: Search knowledge base using embedding (mocked for now)
    const context = await searchKnowledgeBase(companyId, queryEmbedding);

    // Step 3: Generate prompt with context
    const fullPrompt = `
You are a customer support assistant for company ID: ${companyId}
Use the following knowledge base to answer:
${context}

Customer question: "${message}"
Answer in a friendly, professional tone:
    `;
    
    // Step 4: Call Gemini API
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    });
    
    const reply = result.response.text() || "No response from Gemini.";
    
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (error) {
    console.error('Gemini error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
  }
}

const pinecone = new PineconeClient();
await pinecone.init({
  environment: process.env.PINECONE_ENV!,
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX!);

async function searchKnowledgeBase(companyId: string, queryEmbedding: number[]) {
  const results = await index.query({
    vector: queryEmbedding,
    filter: { companyId },
    topK: 3
  });

  return results.matches.map(m => m.metadata.text).join('\n');
}