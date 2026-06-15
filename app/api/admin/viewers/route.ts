import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import type { ViewStatus } from "@/types/api";

function getStatus(
  firstAccessAt: string | null,
  totalSeconds: number
): ViewStatus {
  if (!firstAccessAt) return "none";
  if (totalSeconds >= 600) return "valid_viewer";
  if (totalSeconds >= 60) return "viewer";
  return "accessed";
}

export async function GET(request: NextRequest) {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as ViewStatus | "all" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    // 등록자 전체 조회
    let registrantsQuery = supabase
      .from("registrants")
      .select("id, name, company, email, phone")
      .order("created_at", { ascending: false });

    if (search) {
      registrantsQuery = registrantsQuery.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: registrants, error: regError } = await registrantsQuery;
    if (regError) throw regError;

    // watch_logs 별도 조회 후 Map으로 병합
    const { data: watchLogs, error: watchError } = await supabase
      .from("watch_logs")
      .select("registrant_id, first_access_at, last_access_at, total_watch_seconds");
    if (watchError) throw watchError;

    const watchMap = new Map(
      (watchLogs ?? []).map((w) => [w.registrant_id, w])
    );

    const rows = (registrants ?? []).map((r) => {
      const log = watchMap.get(r.id) ?? null;
      const rowStatus = getStatus(
        log?.first_access_at ?? null,
        log?.total_watch_seconds ?? 0
      );
      return {
        registrant_id: r.id,
        name: r.name,
        company: r.company,
        email: r.email,
        phone: r.phone,
        first_access_at: log?.first_access_at ?? null,
        last_access_at: log?.last_access_at ?? null,
        total_watch_seconds: log?.total_watch_seconds ?? 0,
        status: rowStatus,
      };
    });

    const filtered =
      !status || status === "all"
        ? rows
        : rows.filter((r) => r.status === status);

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      total: filtered.length,
      page,
      limit,
    });
  } catch (err) {
    console.error("[admin/viewers]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
