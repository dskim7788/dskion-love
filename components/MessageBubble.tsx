import type { ChatMessage, Persona } from "@/lib/types";
import { PHOTO_ONLY_PLACEHOLDER } from "@/lib/types";
import { formatTime } from "@/lib/format";
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
        <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
          {message.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.imageUrl}
              alt="보낸 사진"
              className="max-w-[200px] rounded-2xl border border-zinc-200 dark:border-zinc-700 object-cover"
            />
          )}
          {message.content !== PHOTO_ONLY_PLACEHOLDER && (
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isUser
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
                  : "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm shadow-sm border border-zinc-100 dark:border-zinc-700"
              }`}
            >
              {message.content}
            </div>
          )}
          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 px-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
