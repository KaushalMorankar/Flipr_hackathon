// app/[subdomain]/page.tsx
'use client';
import { useRouter } from 'next/navigation';

export default function CompanyPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter();

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Welcome to {params.subdomain}.yourapp.com</h1>
      <button 
        onClick={() => router.push(`/${params.subdomain}/agent/dashboard`)} 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go to Agent Dashboard
      </button>
    </div>
  );
}