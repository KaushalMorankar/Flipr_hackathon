// tools/upload-knowledge.ts
import { Pinecone } from '@pinecone-database/pinecone';

const uploadKnowledge = async () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  const knowledgeBase = {
    company1: [
      { id: 'reset', text: 'How to reset password: Visit https://example.com/reset ' },
      { id: 'billing', text: 'Billing questions: Contact billing@example.com' }
    ],
    company2: [
      { id: 'shipping', text: 'Shipping FAQs: https://example.com/shipping ' },
      { id: 'warranty', text: 'Warranty claims: Use form at https://example.com/warranty ' }
    ]
  };

  // Generate embeddings and upload to Pinecone
  for (const companyId in knowledgeBase) {
    for (const item of knowledgeBase[companyId]) {
      // Use Gemini to generate embedding
      const embeddingResult = await genAI.getGenerativeModel({ model: 'embedding-001' })
        .embedContent({ content: { text: item.text } });

      // Upsert into Pinecone
      await index.namespace(companyId).upsert([
        {
          id: item.id,
          values: embeddingResult.embedding.values,
          metadata: { text: item.text }
        }
      ]);
    }
  }

  console.log('Knowledge base uploaded to Pinecone');
};

uploadKnowledge();