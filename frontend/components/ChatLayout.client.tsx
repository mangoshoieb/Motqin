"use client";

import { useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";
import { fetchSpeech, sendMessage } from "../app/services/ai-teacher.services";
import { Sidebar } from "./Sidebar";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

export const ChatLayoutt = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

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
