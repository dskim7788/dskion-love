import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const [conversationsRes, personasRes] = await Promise.all([
    supabase.from("love_conversations").select("persona_id, state").eq("user_id", userId),
    supabase.from("love_custom_personas").select("persona_id, persona").eq("user_id", userId),
  ]);

  if (conversationsRes.error || personasRes.error) {
    console.error("Sync state fetch error:", conversationsRes.error ?? personasRes.error);
    return NextResponse.json({ error: "동기화 데이터를 불러오지 못했어." }, { status: 502 });
  }

  return NextResponse.json({
    conversations: conversationsRes.data ?? [],
    customPersonas: personasRes.data ?? [],
  });
}
