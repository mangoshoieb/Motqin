"use client";

import { useState } from "react";
import { Mic, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div
      className="
        px-4 py-3
        bg-[var(--chat-toolbar-bg)]
        border-t border-zinc-200 dark:border-zinc-800
        transition-colors
      "
    >
      <div className="flex items-end gap-3">
        {/* Mic button */}
        <button
          type="button"
          className="
            p-2 rounded-full
            text-zinc-500
            hover:bg-zinc-100 dark:hover:bg-zinc-800
            transition-colors
          "
          title="Voice input (coming soon)"
        >
          <Mic className="h-5 w-5" />
        </button>

        {/* Textarea */}
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask your AI Teacher..."
          className="
            flex-1 resize-none rounded-xl
            px-4 py-2 text-sm font-medium
            bg-[var(--input-bg)]
            text-[var(--input-text)]
            placeholder:text-[var(--input-placeholder)]
            border border-[var(--input-border)]
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-colors
          "
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          className="
            p-2 rounded-full
            bg-blue-600 dark:bg-blue-700 text-white
            hover:bg-blue-700 dark:hover:bg-blue-800
            disabled:opacity-50
            transition-colors
          "
          disabled={!value.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};