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
      .select("id, registrant_id, admin_id, message, created_at, is_hidden, is_admin")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const registrantIds = Array.from(
      new Set((rows ?? []).map((m) => m.registrant_id).filter((id): id is string => !!id))
    );
    const adminIds = Array.from(
      new Set((rows ?? []).map((m) => m.admin_id).filter((id): id is string => !!id))
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

    const data: AdminChatMessageView[] = (rows ?? []).map((row) => {
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
