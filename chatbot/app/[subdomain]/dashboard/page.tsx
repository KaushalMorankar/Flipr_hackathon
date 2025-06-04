// app/(your-route)/Dashboard.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import MetricsCard from "@/components/MetricsCard";
import QAAlerts from "@/components/QAAlerts";
import CoachingRecommendations from "@/components/CoachingRecommendations";
import ConversationViewer from "@/components/ConversationViewer";
import TicketModal from "@/components/TicketModal";  // ← import the modal
import type { Ticket, DashboardData } from "@/types";

export default function Dashboard() {
  const params = useParams();
  const subdomain = Array.isArray(params?.subdomain)
    ? params.subdomain[0]
    : (params?.subdomain as string) || "flipr";

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // fetchData can be re-used after a resolve
  const fetchData = useCallback(async () => {
    if (!subdomain) return;
    setLoading(true);
    try {
      const res = await axios.get<DashboardData>(
        `/api/dashboard?path=${encodeURIComponent(subdomain)}`
      );
      setDashboardData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  // initial load & when subdomain changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // passed down to TicketModal
  const handleResolve = async (note: string) => {
    if (!selectedTicket) return;
    try {
      await axios.post("/api/resolve-admin", {
        ticketId: selectedTicket,
        note: note.trim() || undefined,
      });
      await fetchData();
      setSelectedTicket(null);
    } catch (err) {
      console.error("Resolve failed:", err);
      alert("Could not resolve the ticket.");
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }
  if (!dashboardData) {
    return (
      <div className="p-6 text-red-500">
        Failed to load dashboard data
      </div>
    );
  }

  const { metrics, tickets, qa_summary, feedback_recommendations } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, <span className="text-blue-600">{subdomain} Inc.</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor agent performance and improve support quality
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricsCard
          title="Avg Handling Time"
          value={`${metrics?.aht.toFixed(1)}s`}
          description="Average time to resolve"
        />
        <MetricsCard
          title="First Call Resolution"
          value={
            metrics?.fcr != null
              ? `${(metrics.fcr * 100).toFixed(1)}%`
              : "N/A"
          }
          description="Tickets resolved first interaction"
        />
        <MetricsCard
          title="CSAT Score"
          value={metrics?.csat_score?.toString() || "N/A"}
          description="Customer satisfaction"
        />
      </div>

      {/* QA Alerts & Coaching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <QAAlerts violations={qa_summary.policy_violations} />
        <CoachingRecommendations recommendations={feedback_recommendations} />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
        <div className="space-y-4">
          {tickets.map((t: Ticket) => (
            <div
              key={t.id}
              className={`p-4 border rounded cursor-pointer transition ${
                selectedTicket === t.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedTicket(t.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{t.subject}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(t.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    t.status === "RESOLVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={tickets.find((t) => t.id === selectedTicket)!}
          onClose={() => setSelectedTicket(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}
