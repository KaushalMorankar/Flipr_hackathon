// lib/automation.ts
import prisma from "./prisma";
export async function runAutomation(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { messages: true }
  });

  const latestMessage = ticket.messages[ticket.messages.length - 1].content;

  // Example: Password Reset
  if (latestMessage.includes("password") || latestMessage.includes("reset")) {
    // Call password reset API
    await fetch("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: ticket.messages[0].senderId })
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        messages: {
          create: {
            content: "Your password has been reset.",
            role: "assistant"
          }
        }
      }
    });

    return { resolved: true, reason: "Password reset" };
  }

  return { resolved: false };
}