import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user-guard";
import { createServerClient } from "@/lib/supabase/server";

const SYNC_LIMIT = 200;

export async function GET(request: NextRequest) {
  const userOrResponse = await requireUser();
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    if (!since) {
      return NextResponse.json({ ids: [], latest: null });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sapnow_chat_messages")
      .select("id, hidden_at")
      .eq("is_hidden", true)
      .gt("hidden_at", since)
      .order("hidden_at", { ascending: true })
      .limit(SYNC_LIMIT);

    if (error) throw error;

    const rows = data ?? [];
    const ids = rows.map((r) => r.id);
    const latest = rows.length > 0 ? rows[rows.length - 1].hidden_at : null;

    return NextResponse.json({ ids, latest });
  } catch (err) {
    console.error("[chat/messages/hidden GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
