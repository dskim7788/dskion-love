import { PERSONAS } from "@/lib/personas";
import type { Persona } from "@/lib/types";

export default function PersonaSelect({
  onSelect,
}: {
  onSelect: (persona: Persona) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-rose-50 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-2 mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
          디스키온 Love
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
          매일 대화하고 싶은 나만의 AI 컴패니언을 골라보세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onSelect(persona)}
            className="group text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-12 w-12 shrink-0 rounded-full bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-2xl shadow-inner`}
              >
                {persona.avatarEmoji}
              </div>
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {persona.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {persona.tagline}
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {persona.description}
            </p>
            <div className="mt-4 text-xs font-medium text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
              대화 시작하기 →
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 max-w-md text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
        디스키온 Love는 AI가 생성하는 가상의 캐릭터와의 대화 서비스입니다.
        실제 인물이 아니며, 건전한 대화를 지향합니다.
      </p>
    </div>
  );
}
