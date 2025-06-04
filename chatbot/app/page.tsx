'use client';

import Link from 'next/link';

export default function Dashboard() {
  const company = {
    name: 'djwala Inc.',
    subdomain: 'djwala',
    email: 'djwala@gmail.com'
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, <span className="text-blue-600">{company.name}</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your chatbot and knowledge base from your dashboard.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-sm text-gray-600">Company Subdomain</h3>
          <p className="text-lg font-medium text-gray-800">{company.subdomain}.djwalabot.com</p>
        </div>
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-sm text-gray-600">Registered Email</h3>
          <p className="text-lg font-medium text-gray-800">{company.email}</p>
        </div>
        <div className="bg-white p-4 shadow rounded-lg">
          <h3 className="text-sm text-gray-600">Role</h3>
          <p className="text-lg font-medium text-green-600">Admin</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/chatbot">
          <div className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition cursor-pointer">
            <h2 className="text-xl font-semibold">Open Chatbot</h2>
            <p className="text-sm mt-1">Test or demo your AI assistant</p>
          </div>
        </Link>
        <Link href="/knowledgebase">
          <div className="bg-indigo-600 text-white p-6 rounded-lg shadow hover:bg-indigo-700 transition cursor-pointer">
            <h2 className="text-xl font-semibold">Manage Knowledge Base</h2>
            <p className="text-sm mt-1">Add or edit your support content</p>
          </div>
        </Link>
        <Link href="/settings">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow hover:bg-gray-900 transition cursor-pointer">
            <h2 className="text-xl font-semibold">Company Settings</h2>
            <p className="text-sm mt-1">Update subdomain, email, or password</p>
          </div>
        </Link>
      </div>
    </div>
  );
}


// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';

// export default function Dashboard() {
//   const [company, setCompany] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function fetchCompany() {
//       try {
//         const res = await fetch('/api/company/me');
//         const data = await res.json();
//         if (res.ok) {
//           setCompany(data.company);
//         } else {
//           console.error(data.error);
//         }
//       } catch (err) {
//         console.error('Error fetching company:', err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchCompany();
//   }, []);

//   if (loading) return <p className="p-6">Loading dashboard...</p>;
//   if (!company) return <p className="p-6 text-red-600">Unable to load company data.</p>;

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       {/* Header */}
//       <div className="bg-white shadow rounded-lg p-6 mb-6">
//         <h1 className="text-2xl font-semibold text-gray-800">
//           Welcome, <span className="text-blue-600">{company.name}</span>
//         </h1>
//         <p className="text-sm text-gray-600 mt-1">
//           Manage your chatbot and knowledge base from your dashboard.
//         </p>
//       </div>

//       {/* Overview Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white p-4 shadow rounded-lg">
//           <h3 className="text-sm text-gray-600">Company Subdomain</h3>
//           <p className="text-lg font-medium text-gray-800">{company.subdomain}.djwalabot.com</p>
//         </div>
//         <div className="bg-white p-4 shadow rounded-lg">
//           <h3 className="text-sm text-gray-600">Registered Email</h3>
//           <p className="text-lg font-medium text-gray-800">{company.users?.[0]?.email || 'N/A'}</p>
//         </div>
//         <div className="bg-white p-4 shadow rounded-lg">
//           <h3 className="text-sm text-gray-600">Role</h3>
//           <p className="text-lg font-medium text-green-600">
//             {company.users?.[0]?.role || 'Unknown'}
//           </p>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Link href="/chatbot">
//           <div className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition cursor-pointer">
//             <h2 className="text-xl font-semibold">Open Chatbot</h2>
//             <p className="text-sm mt-1">Test or demo your AI assistant</p>
//           </div>
//         </Link>
//         <Link href="/knowledgebase">
//           <div className="bg-indigo-600 text-white p-6 rounded-lg shadow hover:bg-indigo-700 transition cursor-pointer">
//             <h2 className="text-xl font-semibold">Manage Knowledge Base</h2>
//             <p className="text-sm mt-1">Add or edit your support content</p>
//           </div>
//         </Link>
//         <Link href="/settings">
//           <div className="bg-gray-800 text-white p-6 rounded-lg shadow hover:bg-gray-900 transition cursor-pointer">
//             <h2 className="text-xl font-semibold">Company Settings</h2>
//             <p className="text-sm mt-1">Update subdomain, email, or password</p>
//           </div>
//         </Link>
//       </div>
//     </div>
//   );
// }
