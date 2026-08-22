import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { pickProactiveMessage } from "@/lib/proactiveMessages";

export const runtime = "nodejs";
export const maxDuration = 60;

// Don't re-notify a subscription more often than this, in case the cron
// schedule is ever tightened.
const MIN_GAP_HOURS = 18;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ error: "VAPID 설정이 없어." }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = getSupabaseServerClient();
  const cutoff = new Date(Date.now() - MIN_GAP_HOURS * 60 * 60 * 1000).toISOString();

  const { data: subscriptions, error } = await supabase
    .from("love_push_subscriptions")
    .select("*")
    .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`);

  if (error) {
    console.error("Failed to load push subscriptions:", error);
    return NextResponse.json({ error: "구독 목록을 불러오지 못했어." }, { status: 502 });
  }

  let sent = 0;
  let removed = 0;

  for (const sub of subscriptions ?? []) {
    const message = pickProactiveMessage(sub.persona_id);
    const payload = JSON.stringify({
      title: sub.persona_name,
      body: message,
      personaId: sub.persona_id,
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent += 1;
      await supabase
        .from("love_push_subscriptions")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("endpoint", sub.endpoint);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription is no longer valid on the push service's side.
        await supabase.from("love_push_subscriptions").delete().eq("endpoint", sub.endpoint);
        removed += 1;
      } else {
        console.error("Push send failed:", err);
      }
    }
  }

  return NextResponse.json({ sent, removed, checked: subscriptions?.length ?? 0 });
}
