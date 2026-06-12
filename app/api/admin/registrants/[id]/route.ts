import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await request.json();
    const allowed = ["name", "company", "email", "phone", "department", "title"];
    const updates: Record<string, string> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("registrants")
      .update(updates)
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/registrants PATCH]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("registrants")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/registrants DELETE]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
