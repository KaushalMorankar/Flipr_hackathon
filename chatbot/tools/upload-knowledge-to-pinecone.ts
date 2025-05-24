// tools/upload-knowledge-to-pinecone.ts
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dummyKnowledgeBase } from './dummy-knowledge.mjs';

dotenv.config(); // Load .env variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function uploadKnowledgeToPinecone() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

    for (const companyId in dummyKnowledgeBase) {
      for (const item of dummyKnowledgeBase[companyId]) {
        const embeddingResult = await embeddingModel.embedContent({
          content: {
            parts: [{ text: item.content }],
            role: 'user'
          }
        });

        await index.namespace(companyId).upsert([
          {
            id: item.id,
            values: embeddingResult.embedding.values,
            metadata: {
              text: item.content,
              title: item.title,
              companyId
            }
          }
        ]);

        console.log(`✅ Uploaded ${item.id} for ${companyId}`);
      }
    }

    console.log('🚀 Knowledge base uploaded to Pinecone');
  } catch (error) {
    console.error('❌ Pinecone upload error:', error);
  }
}

uploadKnowledgeToPinecone();