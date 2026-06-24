import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

type ImportRow = {
  name: string;
  company: string;
  email: string;
  phone: string;
  department: string;
  title: string;
};

// 업로드 파일의 한글 헤더 → DB 필드 매핑
const COLUMN_MAP: Record<string, keyof ImportRow> = {
  이름: "name",
  성명: "name",
  회사명: "company",
  회사: "company",
  이메일: "email",
  이메일주소: "email",
  휴대폰: "phone",
  휴대폰번호: "phone",
  전화번호: "phone",
  부서: "department",
  부서명: "department",
  직함: "title",
  직급: "title",
};

// 국가번호 제거 및 한국 표준 형식으로 정규화
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("0082")) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("82")) {
    digits = "0" + digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return raw.trim();
}

// GET: 업로드용 템플릿 Excel 다운로드
export async function GET() {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  const ws = XLSX.utils.aoa_to_sheet([
    ["성명", "회사명", "이메일", "휴대폰", "부서명", "직급"],
    ["홍길동", "(주)샘플회사", "hong@example.com", "010-1234-5678", "IT팀", "과장"],
  ]);
  ws["!cols"] = [
    { wch: 12 }, { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "등록자");
  const buffer = Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("registrants_import_template.xlsx")}`,
    },
  });
}

// POST: Excel/CSV 파일로 등록자 일괄 업로드
export async function POST(request: NextRequest) {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일을 선택해주세요." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "xlsx, xls, csv 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "데이터가 없습니다." }, { status: 400 });
    }

    const rows: ImportRow[] = [];
    const parseErrors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const mapped: Partial<ImportRow> = {};

      for (const [key, value] of Object.entries(raw)) {
        const field = COLUMN_MAP[key.trim()];
        if (field) mapped[field] = String(value).trim();
      }

      const rowNum = i + 2;
      if (!mapped.name) { parseErrors.push(`${rowNum}행: 이름 누락`); continue; }
      if (!mapped.company) { parseErrors.push(`${rowNum}행: 회사명 누락`); continue; }
      if (!mapped.email) { parseErrors.push(`${rowNum}행: 이메일 누락`); continue; }
      if (!mapped.phone) { parseErrors.push(`${rowNum}행: 휴대폰 누락`); continue; }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
        parseErrors.push(`${rowNum}행: 이메일 형식 오류 (${mapped.email})`);
        continue;
      }

      rows.push({
        name: mapped.name,
        company: mapped.company,
        email: mapped.email,
        phone: normalizePhone(mapped.phone),
        department: mapped.department ?? "",
        title: mapped.title ?? "",
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "유효한 데이터가 없습니다.", parseErrors },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const emails = rows.map((r) => r.email.toLowerCase());

    const { data: existing } = await supabase
      .from("registrants")
      .select("email")
      .in("email", emails);
    const existingSet = new Set((existing ?? []).map((e: { email: string }) => e.email.toLowerCase()));

    const now = new Date().toISOString();
    const toInsert = rows
      .filter((r) => !existingSet.has(r.email.toLowerCase()))
      .map((r) => ({
        name: r.name,
        company: r.company,
        email: r.email.toLowerCase(),
        phone: r.phone,
        department: r.department,
        title: r.title,
        privacy_agreed: true,
        privacy_agreed_at: now,
        profile_public_agreed: false,
        profile_public_agreed_at: null,
        marketing_agreed: false,
        marketing_agreed_at: null,
        marketing_channel: "Not applicable",
      }));

    const skipped = rows.length - toInsert.length;

    if (toInsert.length > 0) {
      const { error } = await supabase.from("registrants").insert(toInsert);
      if (error) throw error;
    }

    return NextResponse.json({ inserted: toInsert.length, skipped, parseErrors });
  } catch (err) {
    console.error("[admin/import/registrants]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
