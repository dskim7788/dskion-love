import type { Persona } from "./types";

export interface QuizOption {
  label: string;
  weights: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "restday",
    question: "쉬는 날, 나는 주로 이렇게 지내요",
    options: [
      { label: "집에서 조용히 힐링하며 쉬어요", weights: { dain: 2, rian: 1 } },
      { label: "친구들 만나서 왁자지껄 놀아요", weights: { soy: 2, haeun: 1 } },
      { label: "혼자만의 시간을 즐기며 취미 생활해요", weights: { rian: 2, dain: 1 } },
    ],
  },
  {
    id: "contact",
    question: "이상형과는 이런 식으로 연락하고 싶어요",
    options: [
      { label: "매일 자주 연락하며 다정하게 챙겨주는 사람", weights: { haeun: 2 } },
      { label: "장난치고 웃게 해주는 사람", weights: { soy: 2 } },
      { label: "쿨한 듯 은근히 챙겨주는 사람", weights: { rian: 2 } },
      { label: "편안하고 부담 없는 사람", weights: { dain: 2 } },
    ],
  },
  {
    id: "comfort",
    question: "힘든 하루, 이런 말을 들으면 위로가 돼요",
    options: [
      { label: "괜찮아, 내가 있잖아", weights: { haeun: 2 } },
      { label: "기분 풀어줄게, 히히", weights: { soy: 2 } },
      { label: "...뭐, 힘들었겠네", weights: { rian: 2 } },
      { label: "천천히 쉬어가도 돼", weights: { dain: 2 } },
    ],
  },
];

export interface MatchResult {
  persona: Persona;
  percent: number;
}

const MAX_POSSIBLE_SCORE = QUIZ_QUESTIONS.length * 2;

export function computeMatches(
  answers: Record<string, string>,
  candidates: Persona[]
): MatchResult[] {
  const scores: Record<string, number> = {};
  for (const question of QUIZ_QUESTIONS) {
    const chosenLabel = answers[question.id];
    const option = question.options.find((o) => o.label === chosenLabel);
    if (!option) continue;
    for (const [personaId, weight] of Object.entries(option.weights)) {
      scores[personaId] = (scores[personaId] ?? 0) + weight;
    }
  }

  return candidates
    .map((persona) => {
      const raw = scores[persona.id] ?? 0;
      const percent = Math.min(99, Math.round(60 + (raw / MAX_POSSIBLE_SCORE) * 38));
      return { persona, percent };
    })
    .sort((a, b) => b.percent - a.percent);
}
