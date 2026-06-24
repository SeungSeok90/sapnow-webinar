import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-guard";

export async function GET() {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  return NextResponse.json({ role: admin.role, name: admin.name });
}
