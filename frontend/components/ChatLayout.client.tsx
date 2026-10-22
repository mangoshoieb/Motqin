"use client";

import { useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";
import { fetchSpeech, sendMessage } from "../app/services/ai-teacher.services";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthGate } from "@/app/lib/auth-gate.store";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

export const ChatLayoutt = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { isGuest } = useAuth();
  const openGate = useAuthGate((s) => s.open);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // AI is account-only. This chat talks to the AI server directly (no
    // backend check in between), so the guest wall has to live here.
    if (isGuest) {
      openGate({ kind: "registration_required" });
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        
      },
    ]);

    setLoading(true);

    try {
      const data = await sendMessage(text);
      const audioUrl = await fetchSpeech(data.reply);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          audioUrl,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "❌ AI service is unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Chat column */}
      <div className="flex flex-col flex-1 min-h-0">
        <ChatWindow messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
};
