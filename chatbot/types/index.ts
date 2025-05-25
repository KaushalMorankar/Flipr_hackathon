// /types/index.ts
export interface Message {
  role: "user" | "bot";
  text: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: "resolved" | "pending";
  timestamp: string;
  conversation: Message[];
}

export interface DashboardData {
  metrics: {
    aht: number;
    fcr: number;
    csat_score: number | "N/A";
  };
  tickets: Ticket[];
  qa_summary: {
    policy_violations: string[];
  };
  feedback_recommendations: string[];
}