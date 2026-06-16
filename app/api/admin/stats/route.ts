import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: totalRegistrants },
      { count: todayRegistrants },
      { data: loginData },
      { count: videoAccessCount },
      { count: viewerCount },
      { count: validViewerCount },
      { data: recentRegistrants },
      { data: recentViewers },
    ] = await Promise.all([
      supabase.from("registrants").select("*", { count: "exact", head: true }),
      supabase
        .from("registrants")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase.from("login_logs").select("registrant_id").limit(10000),
      supabase
        .from("watch_logs")
        .select("*", { count: "exact", head: true })
        .not("first_access_at", "is", null),
      supabase
        .from("watch_logs")
        .select("*", { count: "exact", head: true })
        .gte("total_watch_seconds", 60),
      supabase
        .from("watch_logs")
        .select("*", { count: "exact", head: true })
        .gte("total_watch_seconds", 600),
      supabase
        .from("registrants")
        .select("id, name, company, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("watch_logs")
        .select(
          "registrant_id, last_access_at, total_watch_seconds, registrants(name, company, email)"
        )
        .not("first_access_at", "is", null)
        .order("last_access_at", { ascending: false })
        .limit(5),
    ]);

    const loginCount = new Set(loginData?.map((l) => l.registrant_id)).size;
    const total = totalRegistrants ?? 0;
    const accessed = videoAccessCount ?? 0;
    const viewers = viewerCount ?? 0;

    return NextResponse.json({
      totalRegistrants: total,
      todayRegistrants: todayRegistrants ?? 0,
      loginCount,
      videoAccessCount: accessed,
      viewerCount: viewers,
      validViewerCount: validViewerCount ?? 0,
      nonAccessCount: Math.max(0, total - accessed),
      viewRate: total > 0 ? Math.round((viewers / total) * 100 * 10) / 10 : 0,
      recentRegistrants: recentRegistrants ?? [],
      recentViewers: recentViewers ?? [],
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
