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
      .from("sapnow_chat_messages")
      .select("id, registrant_id, admin_id, message, created_at, is_hidden, is_admin");

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

    // registrants/admin_users 별도 조회 후 Map으로 병합 (PostgREST 임베드 조인 대신)
    const registrantIds = Array.from(
      new Set(rows.map((m) => m.registrant_id).filter((id): id is string => !!id))
    );
    const adminIds = Array.from(
      new Set(rows.map((m) => m.admin_id).filter((id): id is string => !!id))
    );

    const [{ data: registrants, error: regError }, { data: admins, error: adminError }] =
      await Promise.all([
        registrantIds.length
          ? supabase.from("registrants").select("id, name, company, email").in("id", registrantIds)
          : Promise.resolve({ data: [], error: null }),
        adminIds.length
          ? supabase.from("admin_users").select("id, name").in("id", adminIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (regError) throw regError;
    if (adminError) throw adminError;

    const registrantMap = new Map((registrants ?? []).map((r) => [r.id, r]));
    const adminMap = new Map((admins ?? []).map((a) => [a.id, a]));

    const data: AdminChatMessageView[] = rows.map((row) => {
      // 라이브 운영 페이지에서 admin_id로 직접 보낸 메시지 (registrant_id 없음)
      if (row.admin_id) {
        const admin = adminMap.get(row.admin_id);
        return {
          id: row.id,
          registrantId: null,
          name: admin?.name ? `관리자 · ${admin.name}` : "관리자",
          company: "",
          email: "",
          message: row.message,
          createdAt: row.created_at,
          isHidden: row.is_hidden,
          isAdmin: true,
        };
      }

      // 등록자로 로그인한 상태에서 보낸 메시지 (관리자 세션이 함께 있으면 is_admin=true)
      const registrant = row.registrant_id ? registrantMap.get(row.registrant_id) : undefined;
      return {
        id: row.id,
        registrantId: row.registrant_id,
        name: registrant?.name ?? "(삭제된 등록자)",
        company: registrant?.company ?? "",
        email: registrant?.email ?? "",
        message: row.message,
        createdAt: row.created_at,
        isHidden: row.is_hidden,
        isAdmin: row.is_admin,
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/chat GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
