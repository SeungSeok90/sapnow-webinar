import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, name, role, is_active, last_login_at, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
    }
    if (!["super_admin", "manager"].includes(role)) {
      return NextResponse.json({ error: "올바른 역할을 선택해주세요." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const supabase = createServerClient();

    const { error } = await supabase.from("admin_users").insert({
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      name: name.trim(),
      role,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
