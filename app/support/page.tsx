"use client";

/* Support assistant (Agent 3). A grounded help chat: it answers how Zafe works
   and, when you open it from a deal, questions about that deal's real status.
   The deal is read server-side from your session, never trusted from the client. */

import { useState } from "react";
import AgentChat, { type ChatBubble } from "@/app/_lib/AgentChat";
import { askSupport, getCurrentDealId } from "@/lib/client";

const GREETING: ChatBubble = {
  role: "assistant",
  content: "Hi, I'm the Zafe assistant. Ask me how escrow works, or about your deal's status, a refund, a dispute, or seller verification.",
};

export default function SupportPage() {
  const [messages, setMessages] = useState<ChatBubble[]>([GREETING]);
  const [loading, setLoading] = useState(false);

  async function onSend(text: string) {
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      // Send the real turns only (drop the client-side greeting).
      const turns = next.filter((m, i) => !(i === 0 && m === GREETING));
      const dealId = getCurrentDealId() ?? undefined;
      const res = await askSupport(turns, dealId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't answer just now. Please try again, or open a dispute if it's about a specific deal." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AgentChat
      title="Zafe assistant"
      subtitle="Help with escrow, your deals, refunds, and disputes"
      messages={messages}
      loading={loading}
      onSend={onSend}
      placeholder="Ask a question"
    />
  );
}
