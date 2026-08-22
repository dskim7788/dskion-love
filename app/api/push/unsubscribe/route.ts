import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "필요한 정보가 빠졌어." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("love_push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint);

    if (error) {
      console.error("Push unsubscribe error:", error);
      return NextResponse.json({ error: "알림 해제에 실패했어." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "알림 해제 중 오류가 발생했어." }, { status: 502 });
  }
}
