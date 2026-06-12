import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { adminSessionOptions } from "@/lib/session/admin";
import type { AdminLoginRequest } from "@/types/api";
import type { AdminSessionData } from "@/types/session";

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, email, name, password_hash, role, is_active")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다. 관리자에게 문의해주세요." },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // last_login_at 갱신
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id);

    const response = NextResponse.json({
      success: true,
      role: admin.role,
      name: admin.name,
    });

    const session = await getIronSession<{ admin?: AdminSessionData }>(
      request,
      response,
      adminSessionOptions
    );

    session.admin = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as "super_admin" | "manager",
    };
    await session.save();

    return response;
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
