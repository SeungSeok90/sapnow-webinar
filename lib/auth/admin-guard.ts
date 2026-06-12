import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminSessionOptions } from "@/lib/session/admin";
import type { AdminSessionData } from "@/types/session";

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const session = await getIronSession<{ admin?: AdminSessionData }>(
    cookies(),
    adminSessionOptions
  );
  return session.admin ?? null;
}

export async function requireAdmin(
  requiredRole?: "super_admin"
): Promise<AdminSessionData | NextResponse> {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  if (requiredRole === "super_admin" && admin.role !== "super_admin") {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  return admin;
}

export function isSuperAdmin(admin: AdminSessionData): boolean {
  return admin.role === "super_admin";
}
