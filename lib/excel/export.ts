import * as XLSX from "xlsx";
import type { Registrant, EventSettings } from "@/types/database";
import type { ViewerRow } from "@/types/api";

export function exportRegistrantsToExcel(
  registrants: Registrant[]
): Buffer {
  const rows = registrants.map((r) => ({
    이름: r.name,
    회사명: r.company,
    이메일: r.email,
    휴대폰: r.phone,
    부서: r.department ?? "",
    직함: r.title ?? "",
    개인정보동의: r.privacy_agreed ? "동의" : "미동의",
    개인정보동의일시: r.privacy_agreed_at ?? "",
    마케팅동의: r.marketing_agreed ? "동의" : "미동의",
    마케팅동의일시: r.marketing_agreed_at ?? "",
    등록일시: r.created_at,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "등록자");

  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}

export function exportViewersToExcel(viewers: ViewerRow[]): Buffer {
  const statusLabel: Record<string, string> = {
    none: "미시청",
    accessed: "접속",
    viewer: "시청",
    valid_viewer: "유효시청",
  };

  const rows = viewers.map((v) => ({
    이름: v.name,
    회사명: v.company,
    이메일: v.email,
    휴대폰: v.phone,
    최초접속: v.first_access_at ?? "",
    최종접속: v.last_access_at ?? "",
    누적시청초: v.total_watch_seconds,
    누적시청분: Math.floor(v.total_watch_seconds / 60),
    시청상태: statusLabel[v.status] ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "시청현황");

  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}

export function getExcelFileName(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}_${date}.xlsx`;
}

type WatchLogRow = {
  registrant_id: string;
  first_access_at: string | null;
  last_access_at: string | null;
  total_watch_seconds: number;
};

export function exportFullReport(
  settings: EventSettings | null,
  registrants: Registrant[],
  watchLogs: WatchLogRow[]
): Buffer {
  const wb = XLSX.utils.book_new();
  const watchMap = new Map(watchLogs.map((w) => [w.registrant_id, w]));

  // ── Sheet 1: Summary ──────────────────────────────
  const total = registrants.length;
  const accessors = registrants.filter((r) => watchMap.get(r.id)?.first_access_at).length;
  const viewers = registrants.filter((r) => (watchMap.get(r.id)?.total_watch_seconds ?? 0) >= 60).length;
  const validViewers = registrants.filter((r) => (watchMap.get(r.id)?.total_watch_seconds ?? 0) >= 600).length;
  const totalSecs = registrants.reduce((sum, r) => sum + (watchMap.get(r.id)?.total_watch_seconds ?? 0), 0);
  const avgMins = accessors > 0 ? Math.round(totalSecs / accessors / 60) : 0;
  const viewRate = total > 0 ? Math.round((viewers / total) * 100) : 0;

  const summaryAoa = [
    ["SAP NOW 웨비나 행사 리포트"],
    [],
    ["행사명", settings?.event_name ?? ""],
    ["행사일", settings?.event_date ?? ""],
    ["리포트 생성 일시", new Date().toLocaleString("ko-KR")],
    [],
    ["[ 등록 현황 ]"],
    ["총 등록자", total],
    [],
    ["[ 시청 현황 ]"],
    ["총 접속자", accessors],
    ["시청자 (1분 이상)", viewers],
    ["유효 시청자 (10분 이상)", validViewers],
    ["미접속자", total - accessors],
    ["시청률", `${viewRate}%`],
    ["평균 시청 시간", `${avgMins}분`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoa);
  summarySheet["!cols"] = [{ wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // ── Sheet 2: 등록자 목록 ──────────────────────────
  const regRows = registrants.map((r) => ({
    이름: r.name,
    회사명: r.company,
    이메일: r.email,
    휴대폰: r.phone,
    부서: r.department ?? "",
    직함: r.title ?? "",
    개인정보동의: r.privacy_agreed ? "동의" : "미동의",
    마케팅동의: r.marketing_agreed ? "동의" : "미동의",
    등록일시: r.created_at ? new Date(r.created_at).toLocaleString("ko-KR") : "",
  }));
  const regSheet = XLSX.utils.json_to_sheet(regRows);
  regSheet["!cols"] = [
    { wch: 10 }, { wch: 20 }, { wch: 28 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, regSheet, "등록자 목록");

  // ── Sheet 3: 시청현황 ─────────────────────────────
  const viewerRows = registrants.map((r) => {
    const log = watchMap.get(r.id) ?? null;
    const secs = log?.total_watch_seconds ?? 0;
    let status = "미시청";
    if (log?.first_access_at) {
      if (secs >= 600) status = "유효시청";
      else if (secs >= 60) status = "시청";
      else status = "접속";
    }
    return {
      이름: r.name,
      회사명: r.company,
      이메일: r.email,
      휴대폰: r.phone,
      최초접속: log?.first_access_at ? new Date(log.first_access_at).toLocaleString("ko-KR") : "-",
      최종접속: log?.last_access_at ? new Date(log.last_access_at).toLocaleString("ko-KR") : "-",
      누적시청분: Math.floor(secs / 60),
      시청상태: status,
    };
  });
  const viewerSheet = XLSX.utils.json_to_sheet(viewerRows);
  viewerSheet["!cols"] = [
    { wch: 10 }, { wch: 20 }, { wch: 28 }, { wch: 15 },
    { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, viewerSheet, "시청현황");

  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}
