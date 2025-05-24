// lib/agentRouter.ts
import prisma from '@/lib/prisma';
export async function assignTicketToAgent(ticketId: string, companyId: string) {
  const agents = await prisma.user.findMany({
    where: {
      companyId,
      role: "AGENT"
    },
    include: {
      tickets: { where: { status: "IN_PROGRESS" } }
    }
  });

  // Find agent with lowest workload
  const agent = agents.sort((a, b) => a.tickets.length - b.tickets.length)[0];

  if (agent) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status: "IN_PROGRESS",
        agentId: agent.id
      }
    });
    return agent;
  }

  return null;
}