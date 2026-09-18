import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import { exportViewersToExcel, getExcelFileName } from "@/lib/excel/export";
import type { ViewStatus, ViewerRow } from "@/types/api";

function getStatus(firstAccessAt: string | null, totalSeconds: number): ViewStatus {
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

    const supabase = createServerClient();

    // 등록자 전체 조회
    let registrantsQuery = supabase
      .from("registrants")
      .select("id, name, company, email, phone")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (search) {
      registrantsQuery = registrantsQuery.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: registrants, error: regError } = await registrantsQuery;
    if (regError) throw regError;

    // watch_logs는 등록자와 1:1 관계라 PostgREST 임베드 시 배열이 아닌 객체로 내려오므로
    // 시청현황 목록 API와 동일하게 별도 조회 후 Map으로 병합한다.
    const { data: watchLogs, error: watchError } = await supabase
      .from("watch_logs")
      .select("registrant_id, first_access_at, last_access_at, total_watch_seconds")
      .limit(10000);
    if (watchError) throw watchError;

    const watchMap = new Map(
      (watchLogs ?? []).map((w) => [w.registrant_id, w])
    );

    const rows: ViewerRow[] = (registrants ?? []).map((r) => {
      const log = watchMap.get(r.id) ?? null;
      return {
        registrant_id: r.id,
        name: r.name,
        company: r.company,
        email: r.email,
        phone: r.phone,
        first_access_at: log?.first_access_at ?? null,
        last_access_at: log?.last_access_at ?? null,
        total_watch_seconds: log?.total_watch_seconds ?? 0,
        status: getStatus(log?.first_access_at ?? null, log?.total_watch_seconds ?? 0),
      };
    });

    const filtered =
      !status || status === "all"
        ? rows
        : rows.filter((r) => r.status === status);

    const buffer = exportViewersToExcel(filtered);
    const filename = getExcelFileName("viewers");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("[admin/export/viewers]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
