"use client";

import { useAvatar } from "@/lib/useAvatar";
import type { Persona } from "@/lib/types";
import AvatarImage from "./AvatarImage";

export default function PersonaCard({
  persona,
  onSelect,
  onDelete,
}: {
  persona: Persona;
  onSelect: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
}) {
  const { avatarUrl, isGenerating, error, generate } = useAvatar(
    persona.id,
    persona.isCustom ? persona.avatarPrompt : undefined
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(persona)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(persona);
      }}
      className="group text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0">
          <AvatarImage
            persona={persona}
            avatarUrl={avatarUrl}
            className="h-12 w-12 rounded-full shadow-inner"
            emojiClassName="text-2xl"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              generate();
            }}
            disabled={isGenerating}
            title={avatarUrl ? "사진 다시 생성" : "AI 사진 생성"}
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] shadow disabled:opacity-50"
          >
            {isGenerating ? "…" : "✨"}
          </button>
        </div>
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">{persona.name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{persona.tagline}</div>
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {persona.description}
      </p>
      {error && <p className="mt-2 text-[11px] text-rose-500">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
          대화 시작하기 →
        </span>
        {persona.isCustom && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(persona);
            }}
            className="text-xs text-zinc-400 hover:text-rose-500 transition-colors"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
