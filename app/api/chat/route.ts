import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getPersona, getAffectionStage, BASE_RULES, buildCustomPersonaBlock } from "@/lib/personas";

export const runtime = "nodejs";

interface ChatRequestBody {
  personaId: string;
  affection: number;
  messages: { role: "user" | "assistant"; content: string }[];
  customPersona?: { name: string; personalityDescription: string };
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const FALLBACK_REPLIES = [
  "(데모 응답) 지금은 API 키가 설정되지 않아서 미리 준비된 답으로 대신할게. 그래도 네 얘기 잘 듣고 있어!",
  "(데모 응답) ANTHROPIC_API_KEY를 설정하면 실제 AI 대화로 이어질 수 있어. 지금은 잠깐 대기 모드야.",
];

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }

  const builtInPersona = getPersona(body.personaId);
  let personaSystemPrompt: string;

  if (builtInPersona) {
    personaSystemPrompt = builtInPersona.systemPrompt;
  } else if (body.customPersona?.name && body.customPersona?.personalityDescription) {
    // BASE_RULES always comes from server-side code, never from the client,
    // so a custom persona can never override the safety rules.
    personaSystemPrompt = `${BASE_RULES}\n\n${buildCustomPersonaBlock(body.customPersona)}`;
  } else {
    return NextResponse.json({ error: "존재하지 않는 캐릭터야." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const affection = Number.isFinite(body.affection) ? body.affection : 0;
  const stage = getAffectionStage(affection);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const reply =
      FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    return NextResponse.json({ reply, affectionDelta: 1 });
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `${personaSystemPrompt}

[현재 호감도 단계: ${stage.label} (${affection}/100)]
이 단계에 어울리는 친밀도로 대화해. 단계가 낮을수록 약간 조심스럽고 예의를 갖추고, 단계가 높을수록 더 편안하고 다정하게 대해.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock && "text" in textBlock ? textBlock.text : "음... 잠깐 할 말을 잃었어. 다시 말해줄래?";

    const lastUserMessage = messages[messages.length - 1]?.content ?? "";
    const affectionDelta = Math.min(3, Math.max(1, Math.ceil(lastUserMessage.length / 40)));

    return NextResponse.json({ reply, affectionDelta });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "지금은 대답하기 조금 어려워... 잠시 후 다시 시도해줄래?" },
      { status: 502 }
    );
  }
}
