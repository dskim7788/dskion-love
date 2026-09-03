import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getPersona, getAffectionStage, BASE_RULES, buildCustomPersonaBlock } from "@/lib/personas";

export const runtime = "nodejs";

interface ChatRequestBody {
  personaId: string;
  affection: number;
  casualApproved?: boolean;
  messages: { role: "user" | "assistant"; content: string; imageDataUrl?: string }[];
  customPersona?: { name: string; personalityDescription: string };
}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

function getKstTimeLabel(hour: number): string {
  if (hour < 5) return "새벽";
  if (hour < 8) return "아침 일찍";
  if (hour < 12) return "오전";
  if (hour < 14) return "점심 무렵";
  if (hour < 18) return "오후";
  if (hour < 21) return "저녁";
  return "밤 늦은 시간";
}

function buildTimeContext(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const kstHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour12: false, hour: "numeric" }).format(now)
  );
  const label = getKstTimeLabel(kstHour);

  return `

[현재 시각: ${parts} (한국 시간, ${label})]
이 시각과 자연스럽게 맞는 반응을 해. 새벽/밤에는 "왜 안 자고 있어", "졸리지 않아?" 같은 말을, 낮에는 "밥은 먹었어?" 같은 말을 상황에 맞게 쓸 수 있어. 특히 영상통화 카메라 화면을 보고 반응할 때, 실제 시각과 안 맞는 묘사(예: 한밤중인데 "햇살이 좋다", "낮이라 밝다" 등)는 하지 않는다.`;
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
  const casualApproved = body.casualApproved ?? true;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const reply =
      FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    return NextResponse.json({ reply, affectionDelta: 1 });
  }

  const client = new Anthropic({ apiKey });

  const formalityBlock = casualApproved
    ? ""
    : `

[말투 상태: 아직 반말 허락 전]
방금 처음 만난 사이라 아직 서로 반말을 하기로 하지 않았어. 반드시 존댓말로 정중하고 다정하게 말하고, 자연스러운 타이밍에 "말 편하게 해도 될까요?" 같은 뉘앙스로 반말을 해도 될지 물어봐. 페르소나의 성격은 유지하되 어미만 존댓말로 바꿔서 말해. 사용자가 아직 명확히 동의하지 않았다면 존댓말을 계속 유지해.`;

  const hasImage = messages.some((m) => !!m.imageDataUrl);
  const visionBlock = hasImage
    ? `

[영상통화 카메라]
사용자가 영상통화 중 카메라를 켜서 지금 자기 모습을 보여줬어. 사진 속 모습이나 표정, 배경 등을 자연스럽게 언급하며 반응해줘. 외모를 과도하게 평가하거나 선정적으로 묘사하지 않고, 다정하고 편안한 반응으로 짧게 언급한다.`
    : "";

  const systemPrompt = `${personaSystemPrompt}

[현재 호감도 단계: ${stage.label} (${affection}/100)]
이 단계에 어울리는 친밀도로 대화해. 단계가 낮을수록 약간 조심스럽고 예의를 갖추고, 단계가 높을수록 더 편안하고 다정하게 대해.${formalityBlock}${visionBlock}${buildTimeContext()}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map((m) => {
        const parsedImage = m.imageDataUrl ? parseDataUrl(m.imageDataUrl) : null;
        if (!parsedImage) {
          return { role: m.role, content: m.content };
        }
        return {
          role: m.role,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: parsedImage.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: parsedImage.base64,
              },
            },
            { type: "text" as const, text: m.content },
          ],
        };
      }),
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
