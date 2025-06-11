// components/UserHeader.tsx
import Link from "next/link";

export default function UserHeader() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-700">MySupport Portal</div>
        <nav className="flex space-x-6">
          <Link
            href="/customer/dashboard"
            className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/customer/chat"
            className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Chatbot
          </Link>
        </nav>
      </div>
    </header>
  );
}
