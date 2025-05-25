// app/[subdomain]/agent/analytics/page.tsx
// import AgentDashboard from '../../../../components/AgentDashboard';
import AgentDashboard from '../dashboard/page';

export default function AnalyticsPage({ params }: { params: { subdomain: string } }) {
  return <AgentDashboard params={params} />;
}