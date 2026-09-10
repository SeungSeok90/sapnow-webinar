import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user-guard";
import { createServerClient } from "@/lib/supabase/server";
import { getAnonAlias } from "@/lib/utils/anon";
import type { ChatMessageView, ChatSendRequest } from "@/types/api";

const MAX_MESSAGE_LENGTH = 300;
const INITIAL_LOAD_LIMIT = 50;
const POLL_LIMIT = 100;

export async function GET(request: NextRequest) {
  const userOrResponse = await requireUser();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const supabase = createServerClient();

    const baseQuery = supabase
      .from("sapnow_chat_messages")
      .select("id, registrant_id, message, created_at");

    const { data: rowsRaw, error } = after
      ? await baseQuery
          .gt("created_at", after)
          .order("created_at", { ascending: true })
          .limit(POLL_LIMIT)
      : await baseQuery
          .order("created_at", { ascending: false })
          .limit(INITIAL_LOAD_LIMIT);

    if (error) throw error;

    const rows = after ? (rowsRaw ?? []) : [...(rowsRaw ?? [])].reverse();

    const data: ChatMessageView[] = rows.map((row) => ({
      id: row.id,
      alias: getAnonAlias(row.registrant_id),
      message: row.message,
      createdAt: row.created_at,
      isMine: row.registrant_id === userOrResponse.registrantId,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[chat/messages GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userOrResponse = await requireUser();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

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
      .insert({ registrant_id: userOrResponse.registrantId, message })
      .select("id, registrant_id, message, created_at")
      .single();

    if (error) throw error;

    const view: ChatMessageView = {
      id: data.id,
      alias: getAnonAlias(data.registrant_id),
      message: data.message,
      createdAt: data.created_at,
      isMine: true,
    };

    return NextResponse.json({ data: view });
  } catch (err) {
    console.error("[chat/messages POST]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
