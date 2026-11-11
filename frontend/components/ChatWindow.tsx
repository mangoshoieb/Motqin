import Image from "next/image";
import { Message } from "./ChatLayout.client";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef } from "react";

interface ChatWindowProps {
  messages: Message[];
}

export const ChatWindow = ({ messages }: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[var(--surface)] transition-colors">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex items-end gap-3",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {/* AI avatar */}
          {msg.role === "assistant" && (
            <Image
              src="/view-3d-male-lawyer-suit.jpg"
              alt="AI Teacher"
              width={52}
              height={52}
              className="rounded-full"
            />
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "max-w-xl px-4 py-3 rounded-2xl text-lg leading-relaxed whitespace-pre-line",
              msg.role === "user"
                ? "bg-blue-600 dark:bg-blue-700 text-white rounded-br-md"
                : `
                  bg-[var(--assistant-bg)]
                  text-[var(--assistant-text)]
                  border border-zinc-200 dark:border-zinc-700
                  rounded-bl-md
                `
            )}
          >
            {/* Text */}
            <p>{msg.content}</p>

            {/* 🔊 Audio (assistant only) */}
            {msg.role === "assistant" && msg.audioUrl && (
              <audio
                src={msg.audioUrl}
                controls
                preload="none"
                className="mt-3 w-full max-w-xs"
              />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
