import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

interface SubscribeBody {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  personaId?: string;
  personaName?: string;
}

export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이야." }, { status: 400 });
  }

  const { endpoint, p256dh, auth, personaId, personaName } = body;
  if (!endpoint || !p256dh || !auth || !personaId || !personaName) {
    return NextResponse.json({ error: "필요한 정보가 빠졌어." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("love_push_subscriptions").upsert(
      {
        endpoint,
        p256dh,
        auth,
        persona_id: personaId,
        persona_name: personaName,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Push subscribe error:", error);
      return NextResponse.json({ error: "알림 등록에 실패했어." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "알림 등록 중 오류가 발생했어." }, { status: 502 });
  }
}
