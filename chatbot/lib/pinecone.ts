// lib/pinecone.ts
export async function getVectorResults(companyId: string, query: string): Promise<string> {
  const knowledgeBase = {
    'company1': `
1. How to reset password: Visit https://example.com/reset 
2. Billing questions: Contact billing@example.com
3. Technical support: Call 1-800-555-1234
    `,
    'company2': `
1. Return policy: 30 days from purchase
2. Shipping FAQs: https://example.com/shipping 
3. Warranty claims: Use form at https://example.com/warranty 
    `
  };

  return knowledgeBase[companyId] || "No knowledge base found for this company.";
}