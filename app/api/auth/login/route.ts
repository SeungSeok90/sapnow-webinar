import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { createServerClient } from "@/lib/supabase/server";
import { userSessionOptions } from "@/lib/session/user";
import { getClientIp } from "@/lib/utils/device";
import type { LoginRequest } from "@/types/api";
import type { UserSessionData } from "@/types/session";

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: registrant, error } = await supabase
      .from("registrants")
      .select("id, name, email")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (error || !registrant) {
      return NextResponse.json(
        { error: "등록 정보와 일치하지 않습니다. 이메일을 확인해주세요." },
        { status: 401 }
      );
    }

    // 세션 생성
    const response = NextResponse.json({ success: true, name: registrant.name });
    const session = await getIronSession<{ user?: UserSessionData }>(
      request,
      response,
      userSessionOptions
    );

    session.user = {
      registrantId: registrant.id,
      name: registrant.name,
      email: registrant.email,
    };
    await session.save();

    // 로그인 로그 기록 (실패해도 로그인은 성공으로 처리)
    try {
      await supabase.from("login_logs").insert({
        registrant_id: registrant.id,
        ip_address: getClientIp(request),
        user_agent: request.headers.get("user-agent") || null,
      });
    } catch (logErr) {
      console.error("[auth/login] log error:", logErr);
    }

    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
