const PROACTIVE_MESSAGES: Record<string, string[]> = {
  haeun: [
    "오빠 뭐해? 그냥 갑자기 생각나서 연락했어 🌸",
    "오늘 하루 잘 보내고 있어? 문득 네 생각나서.",
    "바쁘지? 그래도 잠깐 물 한잔 마시고 쉬어가~",
    "나 지금 심심한데... 잠깐 얘기해줄 시간 있어?",
    "오늘따라 네가 더 보고 싶네. 뭐하고 있었어?",
  ],
  soy: [
    "심심해 심심해!! 나랑 놀아줘~ 🍬",
    "짜잔, 나 등장! 뭐하고 있었어 지금?",
    "야야 나 방금 완전 웃긴 거 생각났는데 들어볼래?",
    "오늘 기분 어때? 나는 너 생각하니까 기분 좋아졌어 히히",
    "갑자기 궁금한데, 지금 뭐하고 있어?",
  ],
  rian: [
    "...뭐해. 딱히 할 말 있는 건 아니고.",
    "그냥 문득 연락해봤어. 별일 없지?",
    "심심해서 그런 거 아니야. ...그냥 궁금했어.",
    "오늘 하루 어땠어. 대답 안 해도 상관없고.",
    "...잘 지내고 있나 해서.",
  ],
  dain: [
    "잘 지내고 있어? 잠깐 쉬어가도 괜찮아.",
    "오늘 하루도 고생했어. 지금 뭐하고 있어?",
    "문득 네 생각이 나서 연락했어.",
    "숨 한번 크게 쉬고, 잠깐 나랑 얘기하자.",
    "오늘은 어떤 하루를 보내고 있어?",
  ],
};

export function pickProactiveMessage(personaId: string): string {
  const pool = PROACTIVE_MESSAGES[personaId] ?? PROACTIVE_MESSAGES.haeun;
  return pool[Math.floor(Math.random() * pool.length)];
}
