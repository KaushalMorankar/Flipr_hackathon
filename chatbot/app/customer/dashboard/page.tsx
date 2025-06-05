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


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  feedback?: string | null;
  csat_score?: number | null;   // <-- add csat_score here
}

interface Message {
  id: string;
  content: string;
  role: "agent" | "user" | string;
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
  const [csatScore, setCsatScore] = useState<number>(0); // 0 means “not chosen yet”

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

  // 3) Submit feedback + CSAT for a resolved ticket
  const handleSubmitFeedback = async (ticketId: string) => {
    if (!feedbackInput.trim()) return;
    if (csatScore < 1 || csatScore > 5) {
      alert("Please select a CSAT rating between 1 and 5.");
      return;
    }

    try {
      const res = await fetch(`/api/user/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          feedback: feedbackInput.trim(),
          csatScore,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");

      // If your API returns the updated ticket, you could parse it:
      // const { ticket: updatedTicket } = await res.json();
      // Then use updatedTicket.feedback and updatedTicket.csat_score

      // For immediate UI update, we patch local state:
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, feedback: feedbackInput.trim(), csat_score: csatScore }
            : t
        )
      );
      setFeedbackInput("");
      setCsatScore(0);
    } catch (err) {
      console.error(err);
      alert("Could not submit feedback.");
    }
  };

  // ——— Loading / Error States ———
  if (loading) return <p className="p-6 text-center text-gray-600">Loading…</p>;
  if (error) return <p className="p-6 text-red-500 text-center">{error}</p>;

  // Utility to get a color class based on ticket status
  const statusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== Navigation Header ===== */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold text-gray-700">MySupport Portal</div>
          <nav className="flex space-x-6">
            <Link
              href="/customer/dashboard"
              className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/customer/chat"
              className="px-3 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Chatbot
            </Link>
          </nav>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-grow py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-green-500 to-teal-400 px-6 py-5">
            <h1 className="text-2xl font-semibold text-white">
              Welcome to <span className="underline">{company}</span>
            </h1>
            <p className="mt-1 text-green-100">
              Here’s the status of your support tickets.
            </p>
          </div>

          {/* Your Tickets Section */}
          <section className="p-6">
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              Your Tickets
            </h2>
            {tickets.length === 0 ? (
              <p className="text-gray-600">You haven’t raised any tickets yet.</p>
            ) : (
              <ul className="space-y-4">
                {tickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex justify-between items-center border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-gray-300 transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      setFeedbackInput("");
                      setCsatScore(0);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">{t.title}</span>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadge(
                            t.status
                          )}`}
                        >
                          {t.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2">
                        {t.feedback ? (
                          <>
                            <p className="text-gray-700">
                              <span className="font-medium">Your feedback:</span> {t.feedback}
                            </p>
                            {typeof t.csat_score === "number" && (
                              <p className="text-gray-700 mt-1">
                                <span className="font-medium">Your rating:</span> {t.csat_score}{" "}
                                {t.csat_score === 1 ? "star" : "stars"}
                              </p>
                            )}
                          </>
                        ) : t.status === "resolved" ? (
                          <p className="italic text-gray-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8h2a2 2 0 012 2v8m-2 0H7m0 0a2 2 0 01-2 2H3m2-2v-6a2 2 0 012-2h2m0 0V4a2 2 0 012-2h2a2 2 0 012 2v4m0 0h2a2 2 0 012 2v4m-4 0H7"
                              />
                            </svg>
                            Click to leave feedback & rating
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {/* ===== Modal Overlay ===== */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Chat History – Ticket #{selectedTicketId}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => {
                  setSelectedTicketId(null);
                  setMessages([]);
                  setMessagesError("");
                }}
              >
                <span className="sr-only">Close</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {loadingMessages ? (
                <p className="text-center text-gray-500">Loading messages…</p>
              ) : messagesError ? (
                <p className="text-center text-red-500">{messagesError}</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet.</p>
              ) : (
                <ul className="space-y-4">
                  {messages.map((msg) => {
                    const isAgent = msg.role === "agent";
                    return (
                      <li
                        key={msg.id}
                        className={`flex ${
                          isAgent ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div className="max-w-[75%]">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-700">
                              {msg.senderEmail || (isAgent ? "Support Agent" : "You")}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isAgent
                                ? "bg-white border border-gray-200 text-gray-800"
                                : "bg-green-100 text-gray-800"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Feedback + Rating Form / Existing Feedback */}
            {(() => {
              const currentTicket = tickets.find((t) => t.id === selectedTicketId);

              // If ticket is resolved AND no feedback yet → show form
              if (currentTicket && currentTicket.status === "resolved" && !currentTicket.feedback) {
                return (
                  <div className="p-6 border-t bg-white">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Leave Feedback & Rating
                    </h3>

                    {/* CSAT Rating (1–5) */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-1">
                        Your Rating (1 to 5):
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCsatScore(n)}
                            className={`px-3 py-1 rounded-md border ${
                              csatScore === n
                                ? "border-green-600 bg-green-100 text-green-800"
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {n}★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textual Feedback */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-1">
                        Your Feedback
                      </label>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Your feedback…"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={() => handleSubmitFeedback(selectedTicketId!)}
                      className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Submit Feedback
                    </button>
                  </div>
                );
              }

              // If ticket already has textual feedback, show both feedback + rating
              if (currentTicket && currentTicket.feedback) {
                return (
                  <div className="p-6 border-t bg-white">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Your Feedback & Rating
                    </h3>
                    <p className="italic text-gray-700 mb-2">
                      {currentTicket.feedback}
                    </p>
                    {typeof currentTicket.csat_score === "number" && (
                      <p className="text-gray-700">
                        <span className="font-medium">Your rating:</span>{" "}
                        {currentTicket.csat_score}{" "}
                        {currentTicket.csat_score === 1 ? "star" : "stars"}
                      </p>
                    )}
                  </div>
                );
              }

              // Otherwise (e.g. ticket not resolved yet) → render nothing
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
