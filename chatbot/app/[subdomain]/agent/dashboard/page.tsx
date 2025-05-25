// app/[subdomain]/agent/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AgentDashboard({ params }: { params: { subdomain: string } }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookie = document.cookie;
    const tokenMatch = cookie.match(/auth_token=([^;]+)/);
    if (!tokenMatch) {
      window.location.href = '/agent/login';
      return;
    }

    try {
      const token = tokenMatch[1];
      const decoded = JSON.parse(atob(token.split('.')[1]));

      if (!decoded || decoded.role !== 'AGENT') {
        window.location.href = '/agent/login';
        return;
      }

      // ✅ Use subdomain from JWT
      if (params.subdomain !== decoded.subdomain) {
        window.location.href = `/${decoded.subdomain}/agent/dashboard`;
        return;
      }

      setUser(decoded);
      setLoading(false);
    } catch (error) {
      console.error('JWT decode error:', error);
      window.location.href = '/agent/login';
    }
  }, [params.subdomain]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Agent Dashboard for {params.subdomain}.yourapp.com</h1>
      <p className="mt-2">Welcome, {user.email}</p>
    </div>
  );
}