// app/[subdomain]/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function CompanyLanding({ params }: { params: { subdomain: string } }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const cookie = document.cookie;
    const tokenMatch = cookie.match(/auth_token=([^;]+)/);
    if (tokenMatch) {
      try {
        const decoded = JSON.parse(atob(tokenMatch[1]));
        setUser(decoded);
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  }, []);

  return (
    <div className="p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to {params.subdomain}.yourapp.com
      </h1>

      {user && user.role === 'AGENT' && (
        <a 
          href={`/${params.subdomain}/agent/dashboard`}
          className="bg-blue-600 text-white px-4 py-2 rounded inline-block mt-4"
        >
          Go to Agent Dashboard
        </a>
      )}
    </div>
  );
}