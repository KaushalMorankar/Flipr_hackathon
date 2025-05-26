"use client";
import { useState, useEffect } from 'react';
import CustomerChat from "@/components/CustomerChat";
import { ChevronDown, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const [companies, setCompanies] = useState<{ id: string; name: string; subdomain: string }[]>([]);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/company');
        if (!res.ok) throw new Error('Failed to fetch companies');
        
        const data = await res.json();
        setCompanies(data);

        if (data.length > 0) {
          setSelectedSubdomain(data[0].subdomain);
        }
      } catch (err) {
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-lg font-medium">Loading companies...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">Loading Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 bg-clip-text">
            Customer Support Portal
          </h1>
          <p className="text-gray-600 text-lg">
            Select your organization and get instant assistance
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your organization
              </label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                  value={selectedSubdomain}
                  onChange={e => setSelectedSubdomain(e.target.value)}
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.subdomain}>
                      {c.name} ({c.subdomain}.yourapp.com)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {selectedSubdomain ? (
              <div className="border-t border-gray-200 pt-6">
                <CustomerChat companyId={selectedSubdomain} />
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                <p>Select an organization to start chatting</p>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500">
          <p>24/7 support • Instant responses • Secure communication</p>
        </footer>
      </div>
    </div>
  );
}