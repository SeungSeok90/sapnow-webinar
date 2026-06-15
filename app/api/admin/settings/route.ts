import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("event_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/settings GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await request.json();
    const allowed = [
      "event_name", "event_date", "stream_url", "video_open_at",
      "survey_url", "material_url", "contact_email", "contact_phone",
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key] || null;
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("event_settings")
      .update(updates)
      .eq("id", 1);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/settings PATCH]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
