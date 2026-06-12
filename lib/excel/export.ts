import * as XLSX from "xlsx";
import type { Registrant } from "@/types/database";
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
