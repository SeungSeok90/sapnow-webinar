import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { userSessionOptions } from "@/lib/session/user";
import type { UserSessionData } from "@/types/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const session = await getIronSession<{ user?: UserSessionData }>(
    request,
    response,
    userSessionOptions
  );
  session.destroy();
  return response;
}
