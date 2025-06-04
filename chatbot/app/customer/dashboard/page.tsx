// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';

// interface Ticket {
//   id: string;
//   title: string;
//   status: 'open' | 'in_progress' | 'resolved';
//   feedback?: string;
// }

// export default function UserDashboardPage() {
//   const [company, setCompany] = useState<string>('');
//   const [tickets, setTickets] = useState<Ticket[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');

//   useEffect(() => {
//     async function loadData() {
//       try {
//         const [cRes, tRes] = await Promise.all([
//           fetch('/api/user/company'),
//           fetch('/api/user/tickets'),
//         ]);
//         if (!cRes.ok || !tRes.ok) {
//           throw new Error('Failed to fetch');
//         }
//         const cData = await cRes.json();
//         const tData: Ticket[] = await tRes.json();
//         setCompany(cData.companyName);
//         setTickets(tData);
//       } catch (e) {
//         console.error(e);
//         setError('Could not load your data.');
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadData();
//   }, []);

//   const submitFeedback = async (ticketId: string, feedback: string) => {
//     const res = await fetch(`/api/user/tickets/${ticketId}/feedback`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ feedback }),
//     });
//     if (res.ok) {
//       setTickets((tv) =>
//         tv.map((t) =>
//           t.id === ticketId ? { ...t, feedback } : t
//         )
//       );
//     } else {
//       alert('Could not submit feedback.');
//     }
//   };

//   if (loading) return <p className="p-6 text-center">Loading…</p>;
//   if (error) return <p className="p-6 text-red-500">{error}</p>;

//   return (
//     <div className="min-h-screen bg-gray-50 py-10 px-4">
//       <div className="max-w-3xl mx-auto bg-white shadow-md rounded p-6">
//         <h1 className="text-2xl font-semibold mb-4">Welcome to {company}</h1>
//         <Link
//           href="/customer/chat"
//           className="inline-block mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Go to Chatbot
//         </Link>

//         <h2 className="text-xl font-medium mb-2">Your Tickets</h2>
//         {tickets.length === 0 ? (
//           <p>No tickets raised yet.</p>
//         ) : (
//           <ul className="space-y-4">
//             {tickets.map((t) => (
//               <li key={t.id} className="border rounded p-4">
//                 <div className="flex justify-between items-center">
//                   <span className="font-semibold">{t.title}</span>
//                   <span
//                     className={
//                       t.status === 'resolved'
//                         ? 'text-green-600'
//                         : 'text-yellow-600'
//                     }
//                   >
//                     {t.status}
//                   </span>
//                 </div>

//                 {t.status === 'resolved' && (
//                   <div className="mt-3">
//                     {t.feedback ? (
//                       <p>
//                         <strong>Your feedback:</strong> {t.feedback}
//                       </p>
//                     ) : (
//                       <FeedbackForm
//                         ticketId={t.id}
//                         onSubmit={submitFeedback}
//                       />
//                     )}
//                   </div>
//                 )}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

// function FeedbackForm({
//   ticketId,
//   onSubmit,
// }: {
//   ticketId: string;
//   onSubmit: (id: string, fb: string) => void;
// }) {
//   const [fb, setFb] = useState('');
//   return (
//     <form
//       className="mt-2 flex space-x-2"
//       onSubmit={(e) => {
//         e.preventDefault();
//         if (fb.trim()) {
//           onSubmit(ticketId, fb.trim());
//         }
//       }}
//     >
//       <input
//         type="text"
//         value={fb}
//         onChange={(e) => setFb(e.target.value)}
//         placeholder="Leave your feedback…"
//         className="flex-1 border px-2 py-1 rounded"
//         required
//       />
//       <button
//         type="submit"
//         className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
//       >
//         Send
//       </button>
//     </form>
//   );
// }


// app/customer/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  feedback?: string | null;
}

interface Message {
  id: string;
  content: string;
  role: string;
  senderEmail: string | null;
  createdAt: string; // ISO string
}

export default function UserDashboardPage() {
  // ——— Dashboard State ———
  const [company, setCompany] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // ——— Modal State ———
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string>("");

  // ——— Feedback Form State in Modal ———
  const [feedbackInput, setFeedbackInput] = useState("");

  // 1) Fetch company name + tickets
  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/user/company", { credentials: "include" }),
          fetch("/api/user/tickets", { credentials: "include" }),
        ]);

        if (!cRes.ok) throw new Error("Failed to fetch company");
        if (!tRes.ok) throw new Error("Failed to fetch tickets");

        const cData = await cRes.json();
        const tData: Ticket[] = await tRes.json();

        setCompany(cData.companyName);
        setTickets(tData);
      } catch (e) {
        console.error(e);
        setError("Could not load your data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2) Fetch messages whenever a ticket is selected
  useEffect(() => {
    if (!selectedTicketId) return;

    setLoadingMessages(true);
    setMessagesError("");
    setMessages([]);

    (async () => {
      try {
        const res = await fetch(
          `/api/user/tickets/${selectedTicketId}/messages`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        setMessagesError("Could not load chat history.");
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [selectedTicketId]);

  // 3) Submit feedback for a resolved ticket
  const handleSubmitFeedback = async (ticketId: string) => {
    if (!feedbackInput.trim()) return;
    try {
      const res = await fetch(`/api/user/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ feedback: feedbackInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");

      // Update local state so the ticket’s feedback appears immediately
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, feedback: feedbackInput.trim() } : t
        )
      );
      setFeedbackInput("");
    } catch (err) {
      console.error(err);
      alert("Could not submit feedback.");
    }
  };

  // ——— Loading / Error States ———
  if (loading) return <p className="p-6 text-center">Loading…</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Navigation Header ===== */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex space-x-4">
          <Link
            href="/customer/dashboard"
            className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/customer/chat"
            className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100"
          >
            Chatbot
          </Link>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded p-6">
          <h1 className="text-2xl font-semibold mb-4">Welcome to {company}</h1>
          <h2 className="text-xl font-medium mb-2">Your Tickets</h2>

          {tickets.length === 0 ? (
            <p>No tickets raised yet.</p>
          ) : (
            <ul className="space-y-4">
              {tickets.map((t) => (
                <li
                  key={t.id}
                  className="border rounded p-4 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setFeedbackInput("");
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t.title}</span>
                    <span
                      className={
                        t.status === "resolved"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }
                    >
                      {t.status}
                    </span>
                  </div>

                  {t.status === "resolved" && (
                    <div className="mt-3">
                      {t.feedback ? (
                        <p>
                          <strong>Your feedback:</strong> {t.feedback}
                        </p>
                      ) : (
                        <p className="italic text-gray-500">
                          Click to leave feedback
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* ===== Modal Overlay ===== */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-y-auto shadow-lg relative">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
              onClick={() => {
                setSelectedTicketId(null);
                setMessages([]);
                setMessagesError("");
              }}
            >
              ✕
            </button>

            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Chat History for Ticket: {selectedTicketId}
              </h2>

              {loadingMessages ? (
                <p className="text-center">Loading messages…</p>
              ) : messagesError ? (
                <p className="text-center text-red-500">{messagesError}</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet.</p>
              ) : (
                <ul className="space-y-4 mb-6">
                  {messages.map((msg) => (
                    <li key={msg.id}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">
                          {msg.senderEmail || msg.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-md ${
                          msg.role === "agent"
                            ? "bg-blue-50 text-black"
                            : "bg-green-50 text-black"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Show a feedback form if the ticket is resolved and has no feedback */}
              {(() => {
                const currentTicket = tickets.find(
                  (t) => t.id === selectedTicketId
                );
                if (
                  currentTicket &&
                  currentTicket.status === "resolved" &&
                  !currentTicket.feedback
                ) {
                  return (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">
                        Leave Feedback
                      </h3>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Your feedback…"
                        className="w-full border px-3 py-2 rounded mb-2"
                        rows={3}
                      />
                      <button
                        onClick={() => handleSubmitFeedback(selectedTicketId!)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  );
                }
                // Otherwise, if feedback already exists, show it:
                if (currentTicket && currentTicket.feedback) {
                  return (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">
                        Your Feedback
                      </h3>
                      <p className="italic text-gray-700">
                        {currentTicket.feedback}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
