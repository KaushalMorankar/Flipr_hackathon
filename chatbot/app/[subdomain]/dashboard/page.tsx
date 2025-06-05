// File: app/[subdomain]/agent/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

import MetricsCard from '@/components/MetricsCard';
import QAAlerts from '@/components/QAAlerts';
import CoachingRecommendations from '@/components/CoachingRecommendations';
import TicketModal from '@/components/TicketModal';
import type { Ticket, DashboardData } from '@/types';

export default function AgentDashboardPage() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params.subdomain;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Fetch dashboard data (metrics, tickets, QA summary, recommendations)
  const fetchData = useCallback(async () => {
    if (!subdomain) return;
    setLoading(true);
    try {
      const res = await axios.get<DashboardData>(
        `/api/dashboard?path=${encodeURIComponent(subdomain)}`
      );
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to resolve a ticket (called from TicketModal)
  const handleResolve = async (note: string) => {
    if (!selectedTicketId) return;
    try {
      await axios.post('/api/resolve-admin', {
        ticketId: selectedTicketId,
        note: note.trim() || undefined,
      });
      // Refresh data and close modal
      await fetchData();
      setSelectedTicketId(null);
    } catch (err) {
      console.error('Resolve failed:', err);
      alert('Could not resolve the ticket.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="animate-pulse text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500 text-lg">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { metrics, tickets, qa_summary, feedback_recommendations } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Header with Navigation ===== */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {subdomain}.yourapp.com &mdash; Agent Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor performance, QA alerts, and coaching recommendations
            </p>
          </div>
          <nav className="flex space-x-3">
            <Link
              href={`/${subdomain}/dashboard`}
              className="inline-block bg-gradient-to-r from-green-500 to-teal-400 text-white px-4 py-2 rounded-lg shadow hover:from-green-600 hover:to-teal-500 transition"
            >
              Main Dashboard
            </Link>
            <button
              onClick={() => router.back()}
              className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition"
            >
              Go Back
            </button>
          </nav>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        {/* Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricsCard
            title="Avg Handling Time"
            value={metrics?.aht != null ? `${metrics.aht.toFixed(1)}s` : 'N/A'}
            description="Average time to resolve"
            accentColor="blue"
          />
          <MetricsCard
            title="First Call Resolution"
            value={
              metrics?.fcr != null
                ? `${(metrics.fcr * 100).toFixed(1)}%`
                : 'N/A'
            }
            description="Resolved on first interaction"
            accentColor="green"
          />
          <MetricsCard
            title="CSAT Score"
            value={metrics?.csat_score != null ? metrics.csat_score.toString() : 'N/A'}
            description="Customer satisfaction"
            accentColor="purple"
          />
        </section>

        {/* QA Alerts & Coaching Recommendations */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">QA Alerts</h2>
            <QAAlerts violations={qa_summary.policy_violations} />
          </div>
          <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Coaching Recommendations
            </h2>
            <CoachingRecommendations recommendations={feedback_recommendations} />
          </div>
        </section>

        {/* Recent Tickets */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Tickets</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {tickets.map((t: Ticket) => (
              <div
                key={t.id}
                className={`flex justify-between items-start p-4 border rounded transition ${
                  selectedTicketId === t.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
                } cursor-pointer`}
                onClick={() => setSelectedTicketId(t.id)}
              >
                <div>
                  <p className="font-medium text-gray-800">{t.subject}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(t.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    t.status === 'RESOLVED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="text-center text-gray-500">No recent tickets.</p>
            )}
          </div>
        </section>

        {/* Ticket Modal */}
        {selectedTicketId && (
          <TicketModal
            ticket={tickets.find((t) => t.id === selectedTicketId)!}
            onClose={() => setSelectedTicketId(null)}
            onResolve={handleResolve}
          />
        )}
      </main>
    </div>
  );
}
