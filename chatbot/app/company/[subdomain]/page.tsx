// app/company/[subdomain]/page.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompanyDashboard({ params }: { params: { subdomain: string } }) {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      const res = await fetch(`/api/company/${params.subdomain}`);
      const data = await res.json();
      setCompany(data);
      setLoading(false);
    };
    fetchCompany();
  }, [params.subdomain]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading company data...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Company not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Company Header */}
        <header className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-600">{company.name}</h1>
          <p className="text-gray-600 mt-2">
            Subdomain: <span className="font-mono text-blue-500">{params.subdomain}.yourapp.com</span>
          </p>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Knowledge Base Card */}
          <Link href={`/${params.subdomain}/knowledge`} className="block">
            <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
              <h2 className="text-xl font-semibold">Knowledge Base</h2>
              <p className="text-gray-600 mt-2">
                Manage FAQs, troubleshooting guides, and policies for your AI chatbot.
              </p>
              <div className="mt-4 text-sm text-blue-600">→ Manage Entries</div>
            </div>
          </Link>

          {/* Tickets Card (Placeholder) */}
          <Link href={`/${params.subdomain}/tickets`} className="block">
            <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
              <h2 className="text-xl font-semibold">Tickets</h2>
              <p className="text-gray-600 mt-2">
                View and manage customer support tickets and agent assignments.
              </p>
              <div className="mt-4 text-sm text-blue-600">→ View Tickets</div>
            </div>
          </Link>

          {/* Settings Card (Placeholder) */}
          <Link href={`/${params.subdomain}/settings`} className="block">
            <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-gray-600 mt-2">
                Configure company details, users, and integration settings.
              </p>
              <div className="mt-4 text-sm text-blue-600">→ Manage Settings</div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} YourApp - AI-Powered Customer Support Platform</p>
        </footer>
      </div>
    </div>
  );
}