import { PERSONAS } from "@/lib/personas";
import type { Persona } from "@/lib/types";
import PersonaCard from "./PersonaCard";

export default function PersonaSelect({
  onSelect,
  streak,
}: {
  onSelect: (persona: Persona) => void;
  streak?: number;
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
        {!!streak && streak > 1 && (
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium px-3 py-1">
            🔥 {streak}일 연속 방문 중
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {PERSONAS.map((persona) => (
          <PersonaCard key={persona.id} persona={persona} onSelect={onSelect} />
        ))}
      </div>

      <p className="mt-10 max-w-md text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
        디스키온 Love는 AI가 생성하는 가상의 캐릭터와의 대화 서비스입니다.
        실제 인물이 아니며, 건전한 대화를 지향합니다. 프로필 사진은 AI로 생성된
        가상의 이미지입니다.
      </p>
    </div>
  );
}
