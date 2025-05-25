// components/TicketChart.tsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TicketChart({ metrics }: { metrics: any }) {
  const data = {
    labels: ['Total', 'Resolved', 'Backlog'],
    datasets: [{
      label: 'Tickets',
      data: [
        metrics?.totalTickets || 0,
        metrics?.resolvedTickets || 0,
        metrics?.backlog || 0
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.6)'
    }]
  };

  return <Bar data={data} />;
}