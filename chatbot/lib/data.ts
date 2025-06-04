// lib/data.ts

export type Ticket = {
  id: string;
  title: string;
  userEmail: string;
  status: 'open' | 'in_progress' | 'resolved';
  feedback?: string;
};

export const mockTickets: Ticket[] = [
  {
    id: 't1',
    title: 'Issue with login',
    userEmail: 'user1@example.com',
    status: 'resolved',
    feedback: 'Thanks, it works now!',
  },
  {
    id: 't2',
    title: 'Billing error',
    userEmail: 'user1@example.com',
    status: 'in_progress',
  },
  {
    id: 't3',
    title: 'Bug in chatbot',
    userEmail: 'user2@example.com',
    status: 'open',
  },
];
