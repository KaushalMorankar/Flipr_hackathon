"use client";
import { useState, useEffect } from 'react';
import CustomerChat from "@/components/CustomerChat";

export default function ChatPage() {
  const [companies, setCompanies] = useState<{ id: string; name: string; subdomain: string }[]>([]);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        if (data.length) setSelectedSubdomain(data[0].subdomain);
      })
      .catch(() => setError('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading companies…</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <label className="block mb-2 font-medium">Select Company:</label>
        <select
          className="w-full mb-6 p-3 border rounded"
          value={selectedSubdomain}
          onChange={e => setSelectedSubdomain(e.target.value)}
        >
          {companies.map(c => (
            <option key={c.id} value={c.subdomain}>
              {c.name} ({c.subdomain}.yourapp.com)
            </option>
          ))}
        </select>

        {selectedSubdomain ? (
          <CustomerChat companyId={selectedSubdomain} />
        ) : (
          <p>Select a company to start.</p>
        )}
      </div>
    </div>
  );
}
