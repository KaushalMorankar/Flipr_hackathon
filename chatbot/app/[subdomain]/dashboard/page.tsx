// /app/[subdomain]/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Components
import MetricsCard from "@/components/MetricsCard";
import QAAlerts from "@/components/QAAlerts";
import CoachingRecommendations from "@/components/CoachingRecommendations";
import ConversationViewer from "@/components/ConversationViewer";

// Types
import type { Ticket, DashboardData } from "@/types"; // Update path as needed

export default function Dashboard() {
  const params = useParams();
  const subdomain = Array.isArray(params?.subdomain)
    ? params.subdomain[0]
    : (params?.subdomain as string | undefined) || "flipr";

  const [company, setCompany] = useState<{ name: string; subdomain: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  useEffect(() => {
  async function fetchData() {
    if (!subdomain) return;
    try {
      const res = await axios.get(`/api/dashboard?path=${subdomain}`); // ✅ Backticks added
      const data: DashboardData = res.data;
      console.log(data,res);
      setDashboardData(data);
      setCompany({
        name: `${subdomain} Inc.`, // ✅ Backticks added
        subdomain,
        email: `${subdomain}@gmail.com`,
        role: "Admin",
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [subdomain]);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (!dashboardData) {
    return <div className="p-6 text-red-500">Failed to load dashboard data</div>;
  }

  const { metrics, tickets, qa_summary, feedback_recommendations } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, <span className="text-blue-600">{company?.name}</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">Monitor agent performance and improve support quality</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricsCard
          title="Avg Handling Time"
          value={`${metrics?.aht?.toFixed(1)}s`}
          description="Average time taken to resolve a ticket"
        />
        <MetricsCard
          title="First Call Resolution"
          value={`${(metrics?.fcr * 100).toFixed(1)}%`}
          description="Percentage of tickets resolved on first interaction"
        />
        <MetricsCard
          title="CSAT Score"
          value={metrics?.csat_score || "N/A"}
          description="Customer satisfaction score (1-5)"
        />
      </div>

      {/* QA Alerts & Coaching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <QAAlerts violations={qa_summary?.policy_violations || []} />
        <CoachingRecommendations recommendations={feedback_recommendations || []} />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
        <div className="space-y-4">
          {tickets.map((ticket: Ticket) => (
            <div
              key={ticket.id}
              className={`p-4 border rounded cursor-pointer transition ${
                selectedTicket === ticket.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedTicket(ticket.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{ticket.subject}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(ticket.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    ticket.status === "resolved"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Viewer */}
      {selectedTicket && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Conversation History</h2>
          <ConversationViewer
            conversation={
              tickets.find((t: Ticket) => t.id === selectedTicket)?.conversation || []
            }
          />
        </div>
      )}
    </div>
  );
}