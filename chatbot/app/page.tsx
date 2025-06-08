'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  email: string;
}

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        // Replace this fake data with your real API call
        const fakeData: Company[] = [
          { id: '1', name: 'Djwala Inc.', subdomain: 'djwala', email: 'admin@djwala.com' },
          { id: '2', name: 'Acme Corp.', subdomain: 'acme', email: 'admin@acme.com' },
          { id: '3', name: 'Globex Ltd.', subdomain: 'globex', email: 'admin@globex.io' },
        ];
        setCompanies(fakeData);
        setActiveCompany(fakeData[0]);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="p-6 text-red-600">
        Unable to load any company data.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">My Tenants</h2>
        </div>
        <div className="px-4 py-2">
          {/* Tenant Dropdown */}
          <Menu as="div" className="relative inline-block text-left w-full">
            <div>
              <Menu.Button className="w-full inline-flex justify-between items-center px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-md hover:bg-gray-100 focus:outline-none">
                <span>{activeCompany.name}</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute mt-2 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                {companies.map((c) => (
                  <Menu.Item key={c.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setActiveCompany(c)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                      >
                        {c.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <nav className="mt-6 flex-1 px-2 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/chatbot"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
            Chatbot
          </Link>
          <Link
            href="/knowledgebase"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <BookOpenIcon className="h-5 w-5 mr-3" />
            Knowledge Base
          </Link>
          <Link
            href="/settings"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-3" />
            Settings
          </Link>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex justify-between items-center bg-white shadow px-6 py-4">
          <div className="flex items-center">
            <button className="md:hidden text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-gray-800 ml-4">
              Welcome, <span className="text-indigo-600">{activeCompany.name}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-1 text-gray-500 hover:text-gray-700 focus:outline-none">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full"></span>
            </button>
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none">
                  <UserCircleIcon className="h-8 w-8 mr-2" />
                  <ChevronUpIcon className="h-5 w-5" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700`}
                      >
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/logout"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700`}
                      >
                        Sign Out
                      </Link>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Quick Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-800">1,245</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Conversations Today</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-800">342</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Docs in KB</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-800">58</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-800">16</p>
            </div>
          </section>

          {/* Recent Activity / Quick Links */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2 rounded-full mr-3">
                    10m ago
                  </span>
                  <p className="text-gray-700">
                    <span className="font-semibold">User Jane Doe</span> created a new document in your Knowledge Base.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 rounded-full mr-3">
                    1h ago
                  </span>
                  <p className="text-gray-700">
                    <span className="font-semibold">Chatbot</span> answered 50 questions on your site.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 rounded-full mr-3">
                    3h ago
                  </span>
                  <p className="text-gray-700">
                    <span className="font-semibold">Admin</span> updated company settings.
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
              <div className="mt-4 space-y-4">
                <Link
                  href={`/knowledgebase/new?company=${activeCompany.id}`}
                  className="flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <BookOpenIcon className="h-5 w-5 mr-3" />
                  Add Knowledge Article
                </Link>
                <Link
                  href={`/chatbot/test?company=${activeCompany.id}`}
                  className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                  Test Chatbot
                </Link>
                <Link
                  href={`/settings?company=${activeCompany.id}`}
                  className="flex items-center px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-3" />
                  Company Settings
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
