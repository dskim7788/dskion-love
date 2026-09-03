import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  }

  let body: { personaId?: string; state?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }
  if (!body.personaId || !body.state) {
    return NextResponse.json({ error: "필요한 정보가 빠졌어." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("love_conversations").upsert(
    {
      user_id: userId,
      persona_id: body.personaId,
      state: body.state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,persona_id" }
  );

  if (error) {
    console.error("Sync conversation error:", error);
    return NextResponse.json({ error: "동기화에 실패했어." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
