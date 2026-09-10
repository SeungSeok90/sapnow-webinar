import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminOrResponse = await requireAdmin("super_admin");
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("sapnow_chat_messages")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/chat DELETE]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
