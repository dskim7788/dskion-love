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

  let body: { personaId?: string; persona?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }
  if (!body.personaId || !body.persona) {
    return NextResponse.json({ error: "필요한 정보가 빠졌어." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("love_custom_personas").upsert(
    {
      user_id: userId,
      persona_id: body.personaId,
      persona: body.persona,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,persona_id" }
  );

  if (error) {
    console.error("Sync custom persona error:", error);
    return NextResponse.json({ error: "동기화에 실패했어." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  }

  let body: { personaId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }
  if (!body.personaId) {
    return NextResponse.json({ error: "필요한 정보가 빠졌어." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("love_custom_personas")
    .delete()
    .eq("user_id", userId)
    .eq("persona_id", body.personaId);

  if (error) {
    console.error("Sync custom persona delete error:", error);
    return NextResponse.json({ error: "삭제 동기화에 실패했어." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
