// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function CompanyLoginPage() {
//   const router = useRouter();
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [error, setError] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       // Example: replace with your actual backend or auth logic
//       const res = await fetch('/api/company/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(form),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || 'Login failed');
//       }

//       localStorage.setItem('flipr_company', JSON.stringify(data));
//       router.push('/company/dashboard');
//     } catch (err: any) {
//       setError(err.message || 'Something went wrong');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
//       <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
//         <h2 className="text-2xl font-semibold text-gray-800 mb-6">Company Admin Login</h2>

//         {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-600">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={form.email}
//               onChange={handleChange}
//               className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
//               required
//             />
//           </div>

//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-600">Password</label>
//             <input
//               type="password"
//               name="password"
//               value={form.password}
//               onChange={handleChange}
//               className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
//           >
//             Login
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }


// app/company/login/page.tsx   (or wherever your login lives)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  // We’ll store the subdomain once we compute it.
  const [subdomain, setSubdomain] = useState<string>("");

  // On mount, pull the subdomain out of the host.
  // E.g. if window.location.hostname === "acme.myapp.com",
  // then subdomain = "acme".
  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname; // e.g. "acme.myapp.com"
    const parts = host.split(".");

    // If you expect “<company>.yourdomain.com”:
    // ── parts[0] will be the <company> subdomain.
    // If you have multiple levels (e.g. "region.acme.myapp.com"),
    // you can adjust accordingly.
    if (parts.length >= 3) {
      setSubdomain(parts[0]);
    } else {
      // Fallback (local dev, or no subdomain present).
      // You can decide how you want to handle `localhost` or dev.
      setSubdomain(parts[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Replace with your real company‐login endpoint
      const res = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save company token/information however you like:
      localStorage.setItem("flipr_company", JSON.stringify(data));

      // If we successfully pulled a subdomain, redirect there:
      if (subdomain) {
        // Example: /acme/agent/dashboard
        router.push(`/${subdomain}/agent/dashboard`);
      } else {
        // Fallback if subdomain is empty for some reason
        router.push(`/agent/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Company Admin Login
        </h2>

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
