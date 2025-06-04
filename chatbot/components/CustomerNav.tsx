// app/components/CustomerNav.tsx
"use client";

import Link from "next/link";

export default function CustomerNav() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex space-x-4">
        <Link
          href="/customer/dashboard"
          className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
        >
          Dashboard
        </Link>
        <Link
          href="/customer/chat"
          className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
        >
          Chatbot
        </Link>
      </div>
    </header>
  );
}
