"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";
import { QUIZ_QUESTIONS, computeMatches, type MatchResult } from "@/lib/matching";
import { useAvatar } from "@/lib/useAvatar";
import AvatarImage from "./AvatarImage";
import FloatingParticles from "./FloatingParticles";

type Step = "quiz" | "searching" | "candidates" | "confirmed" | "countdown";

const COUNTDOWN_SECONDS = 15;
const SEARCHING_MS = 1800;

function CandidateAvatar({ persona }: { persona: Persona }) {
  const { avatarUrl } = useAvatar(persona.id, persona.isCustom ? persona.avatarPrompt : undefined);
  return (
    <AvatarImage
      persona={persona}
      avatarUrl={avatarUrl}
      className="h-16 w-16 rounded-full shadow-inner"
      emojiClassName="text-2xl"
    />
  );
}

export default function BlindDateFlow({
  candidates,
  onMatched,
  onExit,
}: {
  candidates: Persona[];
  onMatched: (persona: Persona) => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState<Step>("quiz");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [chosen, setChosen] = useState<Persona | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (step !== "searching") return;
    const timer = setTimeout(() => {
      setMatches(computeMatches(answers, candidates).slice(0, 2));
      setStep("candidates");
    }, SEARCHING_MS);
    return () => clearTimeout(timer);
  }, [step, answers, candidates]);

  useEffect(() => {
    if (step !== "countdown") return;
    if (secondsLeft <= 0) {
      if (chosen) onMatched(chosen);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft, chosen, onMatched]);

  function handleAnswer(label: string) {
    const question = QUIZ_QUESTIONS[questionIndex];
    setAnswers((prev) => ({ ...prev, [question.id]: label }));
    if (questionIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      setStep("searching");
    }
  }

  function handlePick(persona: Persona) {
    setChosen(persona);
    setStep("confirmed");
  }

  function handleStartAppointment() {
    setSecondsLeft(COUNTDOWN_SECONDS);
    setStep("countdown");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-rose-50 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-center overflow-hidden">
      <button
        onClick={onExit}
        className="absolute top-4 left-4 h-9 w-9 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="나가기"
      >
        ✕
      </button>

      {step === "quiz" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-fade-in">
          <div className="flex items-center gap-1.5">
            {QUIZ_QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === questionIndex
                    ? "w-6 bg-rose-400"
                    : i < questionIndex
                    ? "w-1.5 bg-rose-300"
                    : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <div>
            <p className="text-xs text-rose-400 font-medium mb-2">
              이상형 매칭 · {questionIndex + 1}/{QUIZ_QUESTIONS.length}
            </p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {QUIZ_QUESTIONS[questionIndex].question}
            </h2>
          </div>
          <div className="w-full flex flex-col gap-3">
            {QUIZ_QUESTIONS[questionIndex].options.map((option) => (
              <button
                key={option.label}
                onClick={() => handleAnswer(option.label)}
                className="w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-200 hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "searching" && (
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <div className="relative h-20 w-20">
            <span className="absolute inset-0 rounded-full bg-rose-300/40 animate-pulse-ring" />
            <span className="absolute inset-0 flex items-center justify-center text-3xl">💘</span>
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            두근두근... 이상형에 맞는 상대를 찾는 중이에요
          </p>
        </div>
      )}

      {step === "candidates" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in">
          <div>
            <p className="text-xs text-rose-400 font-medium mb-2">매칭 완료!</p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              이런 상대는 어때요?
            </h2>
          </div>
          <div className="w-full flex flex-col gap-3">
            {matches.map((match) => (
              <button
                key={match.persona.id}
                onClick={() => handlePick(match.persona)}
                className="w-full flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 text-left hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-lg transition-all"
              >
                <CandidateAvatar persona={match.persona} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {match.persona.name}
                    </span>
                    <span className="text-xs font-medium text-rose-500 bg-rose-100 dark:bg-rose-500/10 rounded-full px-2 py-0.5">
                      {match.percent}% 매칭
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {match.persona.tagline}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "confirmed" && chosen && (
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <CandidateAvatar persona={chosen} />
          <div>
            <p className="text-xs text-rose-400 font-medium mb-2">소개팅 신청 완료!</p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {chosen.name}님과 만남이 성사됐어요
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              떨리는 마음으로 약속을 잡아볼까요?
            </p>
          </div>
          <button
            onClick={handleStartAppointment}
            className="rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-medium px-6 py-3 shadow-sm hover:brightness-105 transition-all"
          >
            두근두근, 약속 잡기 💌
          </button>
        </div>
      )}

      {step === "countdown" && chosen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black">
          <FloatingParticles count={5} />
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-white/30 animate-pulse-ring" />
            <CandidateAvatarLarge persona={chosen} />
          </div>
          <div className="text-white text-center">
            <p className="text-sm text-white/70">곧 만나요, 조금만 기다려줘</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              00:{secondsLeft.toString().padStart(2, "0")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateAvatarLarge({ persona }: { persona: Persona }) {
  const { avatarUrl } = useAvatar(persona.id, persona.isCustom ? persona.avatarPrompt : undefined);
  return (
    <AvatarImage
      persona={persona}
      avatarUrl={avatarUrl}
      className="relative h-24 w-24 rounded-full border-2 border-white/60"
      emojiClassName="text-4xl"
    />
  );
}
