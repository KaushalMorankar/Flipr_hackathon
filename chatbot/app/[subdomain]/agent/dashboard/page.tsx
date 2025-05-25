// app/[subdomain]/agent/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function AgentDashboard({ params }: { params: { subdomain: string } }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Use valid regex
    const tokenMatch = document.cookie.match(/auth_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      window.location.href = '/agent/login';
      return;
    }

    // ✅ Decode JWT safely
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded || decoded.role !== 'AGENT') {
        window.location.href = '/agent/login';
      }

      setUser(decoded);
      setLoading(false);
    } catch (error) {
      console.error('JWT decode error:', error);
      window.location.href = '/agent/login';
    }
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Agent Dashboard for {params.subdomain}.yourapp.com</h1>
      <p>Welcome, {user?.email}</p>
    </div>
  );
}