// tools/upload-knowledge-to-pinecone.ts
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dummyKnowledgeBase } from './dummy-knowledge.js';  // <-- note .js extension at runtime

dotenv.config();

async function uploadKnowledgeToPinecone() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  for (const namespace of Object.keys(dummyKnowledgeBase)) {
    const docs = dummyKnowledgeBase[namespace];

    // embed + collect
    const batch = await Promise.all(
      docs.map(async (doc) => {
        const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
        const result = await embeddingModel.embedContent({
          content: { parts: [{ text: doc.content }], role: 'user' },
        });

        return {
          id: doc.id,
          values: result.embedding.values,
          metadata: { title: doc.title, text: doc.content },
        };
      })
    );

    // upsert whole batch into the namespace
    await index.namespace(namespace).upsert(batch);
    console.log(`✅ Upserted ${batch.length} docs into namespace "${namespace}"`);
  }

  console.log('🚀 All knowledge uploaded to Pinecone');
}

uploadKnowledgeToPinecone().catch((err) => {
  console.error('❌ Upload error:', err);
  process.exit(1);
});
