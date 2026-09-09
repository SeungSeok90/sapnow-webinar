import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { userSessionOptions } from "@/lib/session/user";
import type { UserSessionData } from "@/types/session";

export async function getUserSession(): Promise<UserSessionData | null> {
  const session = await getIronSession<{ user?: UserSessionData }>(
    cookies(),
    userSessionOptions
  );
  return session.user ?? null;
}

export async function requireUser(): Promise<UserSessionData | NextResponse> {
  const user = await getUserSession();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  return user;
}
