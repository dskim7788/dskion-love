import type { ChatMessage, Persona } from "@/lib/types";
import AvatarImage from "./AvatarImage";

export default function MessageBubble({
  message,
  persona,
  avatarUrl,
}: {
  message: ChatMessage;
  persona: Persona;
  avatarUrl: string | null;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
        {!isUser && (
          <AvatarImage
            persona={persona}
            avatarUrl={avatarUrl}
            className="shrink-0 h-8 w-8 rounded-full"
            emojiClassName="text-sm"
          />
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
              : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm shadow-sm border border-zinc-100 dark:border-zinc-700"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
