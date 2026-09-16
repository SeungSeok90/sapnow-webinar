import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import type { ChatSendRequest } from "@/types/api";

const MAX_MESSAGE_LENGTH = 300;

export async function POST(request: NextRequest) {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body: ChatSendRequest = await request.json();
    const message = (body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `메시지는 ${MAX_MESSAGE_LENGTH}자 이내로 입력해주세요.` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sapnow_chat_messages")
      .insert({
        admin_id: adminOrResponse.adminId,
        message,
        is_admin: true,
      })
      .select("id, message, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        id: data.id,
        message: data.message,
        createdAt: data.created_at,
        adminName: adminOrResponse.name,
      },
    });
  } catch (err) {
    console.error("[admin/chat/send POST]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
