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

    // 전체 등록자 + watch_logs LEFT JOIN
    let query = supabase
      .from("registrants")
      .select(
        `id, name, company, email, phone,
         watch_logs(first_access_at, last_access_at, total_watch_seconds)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: allData, count, error } = await query;
    if (error) throw error;

    // 상태 계산 및 필터링
    type RawRow = {
      id: string;
      name: string;
      company: string;
      email: string;
      phone: string;
      watch_logs: {
        first_access_at: string | null;
        last_access_at: string | null;
        total_watch_seconds: number;
      }[] | null;
    };

    const rows = (allData as RawRow[] ?? []).map((r) => {
      const log = r.watch_logs?.[0] ?? null;
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
