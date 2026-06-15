import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import { exportFullReport, getExcelFileName } from "@/lib/excel/export";
import type { Registrant, EventSettings } from "@/types/database";

export async function GET(request: NextRequest) {
  void request;
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();

    const [settingsRes, registrantsRes, watchLogsRes] = await Promise.all([
      supabase.from("event_settings").select("*").eq("id", 1).single(),
      supabase.from("registrants").select("*").order("created_at", { ascending: false }),
      supabase.from("watch_logs").select("registrant_id, first_access_at, last_access_at, total_watch_seconds"),
    ]);

    if (registrantsRes.error) throw registrantsRes.error;
    if (watchLogsRes.error) throw watchLogsRes.error;

    const buffer = exportFullReport(
      (settingsRes.data as EventSettings) ?? null,
      (registrantsRes.data ?? []) as Registrant[],
      watchLogsRes.data ?? []
    );

    const filename = getExcelFileName("sapnow_report");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("[admin/export/report]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
