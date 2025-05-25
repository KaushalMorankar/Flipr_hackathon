// app/customer/chat/page.tsx
'use client';
import { useState, useEffect } from 'react';
import CustomerChat from "@/components/CustomerChat";

export default function ChatPage() {
  const [companies, setCompanies] = useState<{ id: string; name: string; subdomain: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/company');
        if (!res.ok) throw new Error('Failed to fetch companies');
        
        const data = await res.json();
        setCompanies(data);
        
        if (data.length > 0) {
          setSelectedCompanyId(data[0].id); // ✅ Use dynamic company ID
        }
      } catch (err) {
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Company Selection */}
        <div className="mb-6">
          <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Company
          </label>
          <select
            id="company-select"
            value={selectedCompanyId || ''}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.subdomain}.yourapp.com)
              </option>
            ))}
          </select>
        </div>

        {/* Chat Interface */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">💬 Customer Support</h1>
          <p className="text-gray-600 mt-2">
            Ask us anything — we're here to help!
          </p>
        </header>

        <main className="bg-white shadow-lg rounded-lg p-4">
          {selectedCompanyId ? (
            <CustomerChat companyId={selectedCompanyId} />
          ) : (
            <p className="text-center text-gray-500 py-4">
              Please select a company to start chatting.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}