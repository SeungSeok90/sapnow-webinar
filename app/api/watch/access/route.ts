import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { createServerClient } from "@/lib/supabase/server";
import { userSessionOptions } from "@/lib/session/user";
import { getClientIp, getDeviceType } from "@/lib/utils/device";
import type { UserSessionData } from "@/types/session";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    const session = await getIronSession<{ user?: UserSessionData }>(
      request,
      response,
      userSessionOptions
    );

    if (!session.user?.registrantId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = createServerClient();
    const userAgent = request.headers.get("user-agent") || "";
    const now = new Date().toISOString();

    // first_access_at은 최초 1회만 설정, last_access_at은 항상 갱신
    const { data: existing } = await supabase
      .from("watch_logs")
      .select("id, first_access_at")
      .eq("registrant_id", session.user.registrantId)
      .single();

    if (existing) {
      await supabase
        .from("watch_logs")
        .update({ last_access_at: now })
        .eq("registrant_id", session.user.registrantId);
    } else {
      await supabase.from("watch_logs").insert({
        registrant_id: session.user.registrantId,
        first_access_at: now,
        last_access_at: now,
        total_watch_seconds: 0,
        ip_address: getClientIp(request),
        user_agent: userAgent,
        device_type: getDeviceType(userAgent),
      });
    }

    return response;
  } catch (err) {
    console.error("[watch/access]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
