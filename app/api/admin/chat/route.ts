import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import type { AdminChatMessageView } from "@/types/api";

const LOAD_LIMIT = 200;

export async function GET(request: NextRequest) {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const supabase = createServerClient();

    const baseQuery = supabase
      .from("chat_messages")
      .select("id, registrant_id, message, created_at");

    const { data: messagesRaw, error: msgError } = after
      ? await baseQuery
          .gt("created_at", after)
          .order("created_at", { ascending: true })
          .limit(LOAD_LIMIT)
      : await baseQuery
          .order("created_at", { ascending: false })
          .limit(LOAD_LIMIT);

    if (msgError) throw msgError;

    const rows = after ? (messagesRaw ?? []) : [...(messagesRaw ?? [])].reverse();

    // registrants 별도 조회 후 Map으로 병합 (PostgREST 임베드 조인 대신)
    const registrantIds = Array.from(new Set(rows.map((m) => m.registrant_id)));
    const { data: registrants, error: regError } = registrantIds.length
      ? await supabase
          .from("registrants")
          .select("id, name, company, email")
          .in("id", registrantIds)
      : { data: [], error: null };

    if (regError) throw regError;

    const registrantMap = new Map((registrants ?? []).map((r) => [r.id, r]));

    const data: AdminChatMessageView[] = rows.map((row) => {
      const registrant = registrantMap.get(row.registrant_id);
      return {
        id: row.id,
        registrantId: row.registrant_id,
        name: registrant?.name ?? "(삭제된 등록자)",
        company: registrant?.company ?? "",
        email: registrant?.email ?? "",
        message: row.message,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/chat GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
