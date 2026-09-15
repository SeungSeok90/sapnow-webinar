import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import { exportChatMessagesToExcel, getExcelFileName } from "@/lib/excel/export";
import type { AdminChatMessageView } from "@/types/api";

export async function GET() {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();

    const { data: rows, error } = await supabase
      .from("sapnow_chat_messages")
      .select("id, registrant_id, message, created_at, is_hidden")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const registrantIds = Array.from(new Set((rows ?? []).map((m) => m.registrant_id)));
    const { data: registrants, error: regError } = registrantIds.length
      ? await supabase
          .from("registrants")
          .select("id, name, company, email")
          .in("id", registrantIds)
      : { data: [], error: null };

    if (regError) throw regError;

    const registrantMap = new Map((registrants ?? []).map((r) => [r.id, r]));

    const data: AdminChatMessageView[] = (rows ?? []).map((row) => {
      const registrant = registrantMap.get(row.registrant_id);
      return {
        id: row.id,
        registrantId: row.registrant_id,
        name: registrant?.name ?? "(삭제된 등록자)",
        company: registrant?.company ?? "",
        email: registrant?.email ?? "",
        message: row.message,
        createdAt: row.created_at,
        isHidden: row.is_hidden,
      };
    });

    const buffer = exportChatMessagesToExcel(data);
    const filename = getExcelFileName("chat");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("[admin/export/chat]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
