import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/session/admin";
import type { AdminSessionData } from "@/types/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const session = await getIronSession<{ admin?: AdminSessionData }>(
    request,
    response,
    adminSessionOptions
  );
  session.destroy();
  return response;
}
