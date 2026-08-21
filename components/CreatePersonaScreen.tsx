"use client";

import { useState } from "react";
import type { Persona } from "@/lib/types";
import { buildCustomPersona } from "@/lib/customPersonaStorage";

export default function CreatePersonaScreen({
  onCreate,
  onCancel,
}: {
  onCreate: (persona: Persona) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [personalityDescription, setPersonalityDescription] = useState("");
  const [appearanceDescription, setAppearanceDescription] = useState("");
  const [greeting, setGreeting] = useState("");

  const canSubmit = name.trim().length > 0 && personalityDescription.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const persona = buildCustomPersona({
      name,
      tagline,
      personalityDescription,
      appearanceDescription,
      greeting,
    });
    onCreate(persona);
  }

  return (
    <div className="flex flex-1 flex-col h-dvh bg-zinc-50 dark:bg-black overflow-y-auto">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-4 py-3 sticky top-0 z-10">
        <button
          onClick={onCancel}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
          나만의 캐릭터 만들기
        </div>
      </header>

      <div className="flex-1 px-5 py-6 max-w-lg w-full mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            이름 <span className="text-rose-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="예: 유나"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            한 줄 소개
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={40}
            placeholder="예: 유머러스한 힐링 메이커"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            성격 & 말투 <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={personalityDescription}
            onChange={(e) => setPersonalityDescription(e.target.value)}
            maxLength={600}
            rows={4}
            placeholder="예: 유머 감각이 뛰어나고 늘 긍정적이야. 반말을 쓰고, 힘들 때 재밌는 이야기로 기분을 풀어줘."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100 resize-none"
          />
          <p className="mt-1 text-[11px] text-zinc-400">
            {personalityDescription.length}/600자
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            외모 설명 (프로필 사진 생성용)
          </label>
          <input
            value={appearanceDescription}
            onChange={(e) => setAppearanceDescription(e.target.value)}
            maxLength={300}
            placeholder="예: 짧은 갈색 머리, 안경, 캐주얼한 니트 차림"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            첫 인사말
          </label>
          <input
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            maxLength={100}
            placeholder="비워두면 자동으로 만들어드려요"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white font-medium text-sm py-3 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          캐릭터 만들기
        </button>

        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600 text-center">
          모든 캐릭터는 선정적/노골적 콘텐츠를 생성하지 않는 안전 규칙이 항상 적용됩니다.
        </p>
      </div>
    </div>
  );
}
