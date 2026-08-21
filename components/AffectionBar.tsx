import { getAffectionStage } from "@/lib/personas";

export default function AffectionBar({ affection }: { affection: number }) {
  const stage = getAffectionStage(affection);
  const percent = Math.min(100, Math.max(0, affection));

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-lg leading-none">{stage.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          <span>{stage.label}</span>
          <span>{percent}/100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
