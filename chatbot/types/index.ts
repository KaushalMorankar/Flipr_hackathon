// /types/index.ts
export interface Message {
  role: "user" | "bot";
  text: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "RESOLVED";
  timestamp: string;
  resolution_time?: string;
  conversation: Message[];
}

export interface DashboardData {
  companyId: string;
  metrics?: {
    aht: number;
    fcr: number;
    csat_score: number;
  };
  tickets: Ticket[];
  qa_summary: { policy_violations: string[] };
  feedback_recommendations: string[];
}