import { NextResponse } from "next/server";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "black-forest-labs/flux-schnell";
const SAFETY_SUFFIX =
  ", tasteful, fully clothed, sfw, high quality photorealistic portrait, looking at camera, simple background";
const NEGATIVE_PROMPT =
  "nsfw, nudity, explicit, sexual, underage, child, low quality, deformed, extra limbs, watermark, text";

export async function POST(request: Request) {
  let body: { personaId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }

  const persona = getPersona(body.personaId);
  if (!persona) {
    return NextResponse.json({ error: "존재하지 않는 캐릭터야." }, { status: 400 });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN이 설정되지 않았어. 관리자에게 문의해줘." },
      { status: 501 }
    );
  }

  try {
    const predictionRes = await fetch(
      `https://api.replicate.com/v1/models/${MODEL}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt: persona.avatarPrompt + SAFETY_SUFFIX,
            negative_prompt: NEGATIVE_PROMPT,
            aspect_ratio: "3:4",
            num_outputs: 1,
            output_format: "jpg",
            go_fast: true,
          },
        }),
      }
    );

    const prediction = await predictionRes.json();
    if (!predictionRes.ok) {
      console.error("Replicate error:", prediction);
      return NextResponse.json(
        { error: prediction?.detail || "이미지 생성에 실패했어." },
        { status: 502 }
      );
    }

    const output = prediction.output;
    const imageUrl = Array.isArray(output) ? output[0] : output;
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "이미지 생성 결과가 비어있어." }, { status: 502 });
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "생성된 이미지를 불러오지 못했어." }, { status: 502 });
    }
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const base64 = buffer.toString("base64");
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";

    return NextResponse.json({ imageDataUrl: `data:${contentType};base64,${base64}` });
  } catch (error) {
    console.error("Avatar generation error:", error);
    return NextResponse.json({ error: "이미지 생성 중 오류가 발생했어." }, { status: 502 });
  }
}
