import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { createServerClient } from "@/lib/supabase/server";
import { userSessionOptions } from "@/lib/session/user";
import type { HeartbeatRequest } from "@/types/api";
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

    const body: HeartbeatRequest = await request.json();
    const elapsedSeconds = Math.max(0, Math.min(body.elapsedSeconds ?? 0, 60));

    const supabase = createServerClient();

    await supabase.rpc("increment_watch_seconds", {
      p_registrant_id: session.user.registrantId,
      p_elapsed: elapsedSeconds,
      p_now: new Date().toISOString(),
    });

    return response;
  } catch (err) {
    console.error("[watch/heartbeat]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
