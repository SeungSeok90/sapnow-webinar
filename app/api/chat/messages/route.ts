import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user-guard";
import { getAdminSession } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import { getAnonAlias } from "@/lib/utils/anon";
import type { ChatMessageView, ChatSendRequest } from "@/types/api";

const MAX_MESSAGE_LENGTH = 300;
const INITIAL_LOAD_LIMIT = 50;
const POLL_LIMIT = 100;
const HIDDEN_SYNC_LIMIT = 200;

export async function GET(request: NextRequest) {
  const userOrResponse = await requireUser();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const hiddenSince = searchParams.get("hiddenSince");
    const supabase = createServerClient();

    const baseQuery = supabase
      .from("sapnow_chat_messages")
      .select("id, registrant_id, message, created_at, is_admin")
      .eq("is_hidden", false);

    const messagesQuery = after
      ? baseQuery
          .gt("created_at", after)
          .order("created_at", { ascending: true })
          .limit(POLL_LIMIT)
      : baseQuery
          .order("created_at", { ascending: false })
          .limit(INITIAL_LOAD_LIMIT);

    const hiddenQuery = hiddenSince
      ? supabase
          .from("sapnow_chat_messages")
          .select("id, hidden_at")
          .eq("is_hidden", true)
          .gt("hidden_at", hiddenSince)
          .order("hidden_at", { ascending: true })
          .limit(HIDDEN_SYNC_LIMIT)
      : null;

    const [{ data: rowsRaw, error }, hiddenResult] = await Promise.all([
      messagesQuery,
      hiddenQuery ?? Promise.resolve({ data: [], error: null }),
    ]);

    if (error) throw error;
    if (hiddenResult.error) throw hiddenResult.error;

    const rows = after ? (rowsRaw ?? []) : [...(rowsRaw ?? [])].reverse();

    const data: ChatMessageView[] = rows.map((row) => ({
      id: row.id,
      alias: row.registrant_id ? getAnonAlias(row.registrant_id) : "운영자",
      message: row.message,
      createdAt: row.created_at,
      isMine: row.registrant_id !== null && row.registrant_id === userOrResponse.registrantId,
      isAdmin: row.is_admin,
    }));

    const hiddenRows = hiddenResult.data ?? [];
    const hiddenIds = hiddenRows.map((r) => r.id);
    const hiddenLatest = hiddenRows.length > 0 ? hiddenRows[hiddenRows.length - 1].hidden_at : null;

    return NextResponse.json({ data, hiddenIds, hiddenLatest });
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

    const admin = await getAdminSession();

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sapnow_chat_messages")
      .insert({
        registrant_id: userOrResponse.registrantId,
        message,
        is_admin: !!admin,
      })
      .select("id, registrant_id, message, created_at, is_admin")
      .single();

    if (error) throw error;

    const view: ChatMessageView = {
      id: data.id,
      alias: getAnonAlias(data.registrant_id),
      message: data.message,
      createdAt: data.created_at,
      isMine: true,
      isAdmin: data.is_admin,
    };

    return NextResponse.json({ data: view });
  } catch (err) {
    console.error("[chat/messages POST]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
