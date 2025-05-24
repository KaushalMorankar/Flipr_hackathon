// app/[subdomain]/agent/dashboard/page.tsx
'use client';
import { useEffect } from 'react';

export default function AgentDashboard({ params }: { params: { subdomain: string } }) {
  useEffect(() => {
    const cookie = document.cookie;
    const token = cookie.match(/auth_token=([^;]+)/)?.[1];

    if (!token) {
      window.location.href = '/agent/login';
    }
  }, []);

  return (
    <div className="p-4">
      <h1>Agent Dashboard for {params.subdomain}.yourapp.com</h1>
      <p>You are logged in</p>
    </div>
  );
}