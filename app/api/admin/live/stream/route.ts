import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const adminOrResponse = await requireAdmin();
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("event_settings")
      .select("stream_url")
      .eq("id", 1)
      .single();

    if (error) throw error;
    return NextResponse.json({ streamUrl: data?.stream_url ?? null });
  } catch (err) {
    console.error("[admin/live/stream GET]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
