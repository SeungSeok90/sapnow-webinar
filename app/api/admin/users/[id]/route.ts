import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name) updates.name = body.name.trim();
    if (body.role && ["super_admin", "manager"].includes(body.role)) {
      updates.role = body.role;
    }
    if (typeof body.is_active === "boolean") {
      updates.is_active = body.is_active;
    }
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
      }
      updates.password_hash = await bcrypt.hash(body.password, 12);
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  // 자기 자신 삭제 방지
  if (adminOrResponse.adminId === params.id) {
    return NextResponse.json({ error: "자기 자신의 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
